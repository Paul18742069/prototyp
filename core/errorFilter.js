function determineCategory(error) {
    const textToSearch = (error.wcagCriterion + " " + error.errorMessage).toLowerCase();

    if (textToSearch.includes('alt attribute') || textToSearch.includes('image-alt') || textToSearch.includes('h37')) {
        return 'Missing alt text on images';
    }
    if (textToSearch.includes('contrast') || textToSearch.includes('g18.fail')) {
        return 'Insufficient color contrast';
    }
    if (textToSearch.includes('lang attribute') || textToSearch.includes('html-has-lang') || textToSearch.includes('h57.2')) {
        return 'Missing lang attribute (Document language)';
    }
    if (textToSearch.includes('landmark') || textToSearch.includes('region')) {
        return 'Missing page structure (Landmarks/Regions)';
    }
    if (textToSearch.includes('link') || textToSearch.includes('h30.2') || textToSearch.includes('accessible text')) {
        return 'Missing or unclear link text';
    }
    if (textToSearch.includes('select') || textToSearch.includes('form field') || textToSearch.includes('label')) {
        return 'Missing form label';
    }

    return 'Other errors';
}

function getOverlappingErrors(allErrors) {
    const aggregated = {};

    allErrors.forEach((error) => {
        const category = determineCategory(error);

        if (!aggregated[category]) {
            aggregated[category] = {
                issueCategory: category,
                foundByTools: [error.toolName],
                totalOccurrences: 1,
                exampleSelectors: [error.cssSelector]
            };
        } else {
            aggregated[category].totalOccurrences++;

            if (!aggregated[category].foundByTools.includes(error.toolName)) {
                aggregated[category].foundByTools.push(error.toolName);
            }

            if (aggregated[category].exampleSelectors.length < 3 && !aggregated[category].exampleSelectors.includes(error.cssSelector)) {
                aggregated[category].exampleSelectors.push(error.cssSelector);
            }
        }
    });

    return Object.values(aggregated);
}

module.exports = getOverlappingErrors;