function determineWcagCriterion(error) {
    const code = (error.wcagCriterion || "").toLowerCase();

    const pa11yMatch = code.match(/([1-4])_([1-9])_([0-9]{1,2})/);
    if (pa11yMatch) {
        return `WCAG ${pa11yMatch[1]}.${pa11yMatch[2]}.${pa11yMatch[3]}`;
    }

    const axeMatch = code.match(/wcag(\d)(\d)(\d{1,2})/);
    if (axeMatch) {
        return `WCAG ${axeMatch[1]}.${axeMatch[2]}.${axeMatch[3]}`;
    }

    const ruleMapping = {
        'image-alt': 'WCAG 1.1.1',
        'color-contrast': 'WCAG 1.4.3',
        'html-has-lang': 'WCAG 3.1.1',
        'link-name': 'WCAG 2.4.4',
        'label': 'WCAG 3.3.2',
        'landmark-one-main': 'WCAG 1.3.1',
        'document-title': 'WCAG 2.4.2',
        'button-name': 'WCAG 4.1.2',
        'list': 'WCAG 1.3.1',
        'listitem': 'WCAG 1.3.1',
        'tabindex': 'WCAG 2.4.3',
        'bypass': 'WCAG 2.4.1',
    };

    if (ruleMapping[code]) {
        return ruleMapping[code];
    }

    return `Unmapped Rule: ${code}`;
}

function normalizeSelector(selector) {
    if (!selector || selector === 'N/A') return 'unknown-element';
    return selector.trim().toLowerCase().replace(/\s+/g, ' ');
}

function doSelectorsMatch(sel1, sel2) {
    if (sel1 === sel2) return true;
    if (sel1 === 'unknown-element' || sel2 === 'unknown-element') return false;

    if ((sel1.includes(sel2) && sel2.length > 5) || (sel2.includes(sel1) && sel1.length > 5)) {
        return true;
    }

    const idMatch1 = sel1.match(/#[a-z0-9_-]+/i);
    const idMatch2 = sel2.match(/#[a-z0-9_-]+/i);
    if (idMatch1 && idMatch2 && idMatch1[0] === idMatch2[0]) {
        return true;
    }

    const attrMatch1 = sel1.match(/\[(.*?)\]/);
    const attrMatch2 = sel2.match(/\[(.*?)\]/);
    if (attrMatch1 && attrMatch2 && attrMatch1[0] === attrMatch2[0]) {
        return true;
    }

    return false;
}

function getOverlappingErrors(allErrors) {
    const aggregated = [];

    allErrors.forEach((error) => {
        const wcagCategory = determineWcagCriterion(error);
        const normalizedSelector = normalizeSelector(error.cssSelector);

        const existingMatch = aggregated.find(item =>
            item.issueCategory === wcagCategory &&
            doSelectorsMatch(normalizeSelector(item.cssSelector), normalizedSelector)
        );

        if (!existingMatch) {
            aggregated.push({
                issueCategory: wcagCategory,
                cssSelector: error.cssSelector, // Original für den Report behalten
                foundByTools: [error.toolName],
                totalOccurrences: 1
            });
        } else {
            existingMatch.totalOccurrences++;

            if (!existingMatch.foundByTools.includes(error.toolName)) {
                existingMatch.foundByTools.push(error.toolName);
            }
        }
    });

    return aggregated;
}

module.exports = getOverlappingErrors;