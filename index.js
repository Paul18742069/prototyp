const fs = require('fs');
const path = require('path');

// Wir importieren nur noch unsere 3 Tools (keinen Aggregator mehr)
const runPa11y = require('./tools/pa11yRunner');
const runAxe = require('./tools/axeRunner');
const runLighthouse = require('./tools/lighthouseRunner');

async function runTest() {
    console.log("Starting automated accessibility test...");
    const testUrl = 'https://www.w3.org/WAI/demos/bad/before/home.html';
    let allCleanData = [];

    // Ordner für die Ergebnisse vorbereiten
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir);
    }

    try {
        console.log("Running Pa11y...");
        const pa11yClean = await runPa11y(testUrl);
        allCleanData = allCleanData.concat(pa11yClean);
        console.log(`   -> Pa11y found ${pa11yClean.length} errors.`);

        console.log("Running Axe-core...");
        const axeClean = await runAxe(testUrl);
        allCleanData = allCleanData.concat(axeClean);
        console.log(`   -> Axe-core found ${axeClean.length} errors.`);

        console.log("Running Lighthouse...");
        const lighthouseClean = await runLighthouse(testUrl);
        allCleanData = allCleanData.concat(lighthouseClean);
        console.log(`   -> Lighthouse found ${lighthouseClean.length} errors.`);

        console.log(`\nTotal errors collected (Unfiltered/Raw): ${allCleanData.length}`);

        // Speichere die ungefilterten Gesamtdaten im results-Ordner
        const outputPath = path.join(resultsDir, 'combined-raw-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(allCleanData, null, 2));

        console.log("Testing completed successfully!");
        console.log(`Results saved to: ${outputPath}`);

    } catch (error) {
        console.error("Es gab einen Fehler bei der Ausführung:", error);
    }
}

runTest();