global.usFirst = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

global.strToBool = function (string) {
    switch (string.toLowerCase()) {
        case "1":
        case "true":
            return true;
    }

    return false;
}

/**
 * Parses an integer from a value or provides a fallback value if parsing fails.
 * @param {string} value - The value to parse.
 * @param {number} fallback - The fallback value.
 * @returns {number} The parsed integer or fallback value.
 */
global.parseIntOrFallback = function(value, fallback) {
    return Number.isInteger(parseInt(value)) ? parseInt(value) : fallback;
}