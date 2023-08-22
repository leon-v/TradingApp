class Conditions {

    /**
     * Constructs a new Conditions object based on the provided conditions string.
     * @param {string} conditionsString - The string containing conditions.
     */
    constructor(conditionsString) {
        this.operations = ['=', '==', '>', '<', '>=', '<='];
        this.conditions = this.parseConditions(conditionsString);
    }

    /**
     * Parses the conditions string into a dictionary of conditions.
     * @param {string} conditionsString - The string containing conditions.
     * @returns {Object} - Dictionary of conditions.
     */
    parseConditions(conditionsString) {
        const conditions = {};
        const conditionParts = conditionsString.split(',');

        for (const conditionPart of conditionParts) {
            const { key, operator, value } = this.splitConditionPart(conditionPart);

            if (!key || !operator || !value) {
                continue;
            }

            const normalizedOperator = this.normalizeOperator(operator);
            if (!normalizedOperator) {
                continue;
            }

            if (!conditions[key]) {
                conditions[key] = [];
            }

            conditions[key].push({
                operation: normalizedOperator,
                value: value
            });
        }

        return conditions;
    }

    /**
     * Splits a condition part into key, operator, and value components.
     * @param {string} conditionPart - The condition part to split.
     * @returns {Object|null} - An object containing key, operator, and value properties, or null if parsing fails.
     */
    splitConditionPart(conditionPart) {
        const operators = this.operations.sort((a, b) => b.length - a.length); // Sort by length to prioritize >= and <=
        let operator = '';
        for (const op of operators) {
            if (conditionPart.includes(op)) {
                operator = op;
                break;
            }
        }

        if (!operator) {
            return null;
        }

        const [key, value] = conditionPart.split(operator).map(part => part.trim());
        return { key, operator, value };
    }

    /**
     * Normalizes the given operator by removing any spaces and ensuring it's a valid operation.
     * @param {string} operator - The operator to normalize.
     * @returns {string|null} - The normalized operator or null if the operator is invalid.
     */
    normalizeOperator(operator) {
        if (this.operations.includes(operator)) {
            return operator;
        }
        return null;
    }

    /**
     * Compares an object with the defined conditions and returns whether all conditions are met.
     * @param {Object} object - The object to compare against the conditions.
     * @returns {boolean} - True if all conditions are met, otherwise false.
     */
    compareObjectWithConditions(object) {
        for (const key in this.conditions) {
            if (this.conditions[key].every(condition => condition.operation === '=')) {
                console.log(`All conditions for key ${key} are using =. Skipping.`);
                continue;
            }

            if (!(key in object)) {
                console.log(`Key not found in input object: ${key}`);
                return false;
            }

            const value = object[key];
            const keyConditions = this.conditions[key];

            console.log(`Checking conditions for key: ${key}`);
            if (!this.checkConditionsForKey(keyConditions, value)) {
                console.log(`Conditions for key ${key} not met.`);
                return false;
            }

            console.log(`Conditions for key ${key} met.`);
        }

        console.log('All conditions met for all keys.');
        return true;
    }

    /**
     * Checks if the specified conditions for a key are met for a given value.
     * @param {Array} conditions - The conditions to check for the key.
     * @param {*} value - The value to compare against the conditions.
     * @returns {boolean} - True if all conditions are met, otherwise false.
     */
    checkConditionsForKey(conditions, value) {
        for (const condition of conditions) {
            if (!this.operations.includes(condition.operation)) {
                console.log(`Unsupported operator: ${condition.operation}. Skipping.`);
                continue;
            }

            if (!this.compareValues(condition.operation, value, condition.value)) {
                console.log(`Comparison failed: data ${value} ${condition.operation} cond ${condition.value}`);
                return false;
            }

            console.log(`Comparison success: data ${value} ${condition.operation} cond ${condition.value}`);
        }

        return true;
    }

    /**
     * Compares two values using the specified operation.
     * @param {string} operation - The operation to use for comparison.
     * @param {*} actualValue - The actual value for comparison.
     * @param {*} expectedValue - The expected value for comparison.
     * @returns {boolean} - True if the comparison is true, otherwise false.
     */
    compareValues(operation, actualValue, expectedValue) {
        switch (operation) {
            case '==':
                return actualValue == expectedValue;
            case '>':
                return actualValue > expectedValue;
            case '<':
                return actualValue < expectedValue;
            case '>=':
                return actualValue >= expectedValue;
            case '<=':
                return actualValue <= expectedValue;
            default:
                return false;
        }
    }

    /**
     * Retrieves the value associated with the specified key using the '=' operation.
     * @param {string} key - The key for which to retrieve the value.
     * @returns {*} - The value associated with the key, or undefined if not found.
     */
    getValue(key) {
        if (this.conditions[key]) {
            const equalCondition = this.conditions[key].find(condition => condition.operation === '=');
            if (equalCondition) {
                return equalCondition.value;
            }
        }

        return undefined;
    }
}