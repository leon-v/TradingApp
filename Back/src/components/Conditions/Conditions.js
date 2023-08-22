class Conditions {
    constructor(conditionsString) {
        this.operations = ['=', '==', '>', '<', '>=', '<='];
        this.conditions = this.parseConditions(conditionsString);
    }

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

    normalizeOperator(operator) {
        if (this.operations.includes(operator)) {
            return operator;
        }
        return null;
    }

    /******************************************** */
    // ... (other methods)

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