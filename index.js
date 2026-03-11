const pa11y = require('pa11y');
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

function mapPa11yResults(pa11yRawData) {
    return pa11yRawData.issues.map(issue => ({
        toolName: 'pa11y',
        wcagCriterion: issue.code,
        cssSelector: issue.selector,
        errorMessage: issue.message,
    }));
}

function mapAxeResults(axeRawData) {
    let cleanResults = [];

    axeRawData.violations.forEach(violation => {
        violation.nodes.forEach(node => {
            cleanResults.push({
                toolName: 'Axe-core',
                wcagCriterion: violation.tags.find(tag => tag.includes('wcag')) || violation.id,
                cssSelector: node.target.join(', '),
                errorMessage: node.failureSummary || violation.help
            });
        });
    });
    return cleanResults;
}

function mapLighhouseResults(lighthouseRawData) {
    let cleanResults = [];
    const audits = lighthouseRawData.lhr.audits;

    for (let auditId in audits) {
        const audit = audits[auditId];
        if(audit.score === 0 && audit.details && audit.details.type === 'table') {
            audit.details.items.forEach(item => {
                cleanResults.push({
                    toolName: 'Lighthouse',
                    wcagCriterion: auditId,
                    cssSelector: item.node ? item.node.selector : 'N/A',
                    errorMessage: audit.title + ": " + audit.description,
                });
            });
        }
    }
    return cleanResults;
}

async function runTest() {
    console.log("Starting automated accessibility test...");
    const testUrl = 'https://www.w3.org/WAI/demos/bad/before/home.html';
    let allCleanData = [];

    try {
        console.log("Running Pa11y...");
        const pa11yRaw = await pa11y(testUrl);
        const pa11yClean = mapPa11yResults(pa11yRaw);
        allCleanData = allCleanData.concat(pa11yClean);
        console.log(`   -> Pa11y found ${pa11yClean.length} errors.`)

        console.log("Running Axe-core...");
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(testUrl);

        const axeRaw = await new AxePuppeteer(page).analyze();
        const axeClean = mapAxeResults(axeRaw);
        allCleanData = allCleanData.concat(axeClean);
        await browser.close();
        console.log(`   -> Axe-core found ${axeClean.length} errors.`)

        console.log("Running Lighthouse...");
        const { default: lighthouse } = await import('lighthouse');
        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
        const lighthouseOptions = {
            logLevel: 'silent',
            output: 'json',
            onlyCategories: ['accessibility'],
            port: chrome.port
        };
        const lighthouseRaw = await lighthouse(testUrl, lighthouseOptions);
        const lighthouseClean = mapLighhouseResults(lighthouseRaw);
        allCleanData = allCleanData.concat(lighthouseClean);

        try {
            await chrome.kill();
        } catch (killError) {
            console.log("   -> Info: Windows blocked deleting the temp directory, testing continues anyway.")
        }
        console.log(`   -> Lighthouse found ${lighthouseClean.length} errors.`)

        fs.writeFileSync("combined-results.json", JSON.stringify(allCleanData, null, 2));
        console.log("Testing completed successfully!");
        console.log("Results saved to combined-results.json");

    } catch (error) {
        console.error(error);
    }
}

runTest();