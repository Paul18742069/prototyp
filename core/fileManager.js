const fs = require('fs');
const path = require('path');

function saveAllResults(allCleanData, multiToolErrors, singleToolErrors) {
    const resultsDir = path.join(__dirname, '../results');

    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir);
    }

    fs.writeFileSync(path.join(resultsDir, 'combined-raw-results.json'), JSON.stringify(allCleanData, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'multi-tool-overlaps.json'), JSON.stringify(multiToolErrors, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'single-tool-errors.json'), JSON.stringify(singleToolErrors, null, 2));
}

module.exports = saveAllResults;