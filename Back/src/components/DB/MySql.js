const AWSSecrets = require("../AwsSecrets/AwsSecrets");
const mysql = require("mysql");

/**
 * A class representing a MySQL database connection manager.
 */
class MySql {

    /**
     * Creates an instance of the MySql class.
     * @param {object} appConfig - Configuration settings for the application.
     */
    constructor(appConfig) {

         /**
         * The configuration settings for the application.
         * @type {object}
         */
        this.appConfig = appConfig;

        /**
         * The MySQL connection instance.
         * @type {object|null}
         */
        this.connectionInstance = null;
    }

    /**
     * Gets the MySQL connection instance. If not available, creates a new connection instance.
     * @returns {Promise<object>} The MySQL connection instance.
     */
    get connection() {

        if (this.connectionInstance) {
            return this.connectionInstance;
        }

        return this.connectionInstance = this.getConnectionInstance();
    }

    /**
     * Creates a MySQL connection instance based on the configuration settings.
     * @returns {Promise<object>} The MySQL connection instance.
     */
    async getConnectionInstance() {

        const secrets = new AWSSecrets(this.appConfig);

        const secretValues = await secrets.getSecretValue(this.appConfig.secretsKey);

        const rdsSecretValues = await secrets.getSecretValue(secretValues.rdsSecretsKey);

        console.log(rdsSecretValues.password);

        const connectionSettings = {
            host: secretValues.rdsHost,
            user: rdsSecretValues.username,
            password: rdsSecretValues.password,
            database: this.appConfig.database
        };

        const connectionInstance = mysql.createConnection(connectionSettings);

        connectionInstance.connect();

        return connectionInstance;

    }

    /**
     * Returns a singleton instance of the MySql class based on the provided dependee.
     * @param {object} dependee - An object with required properties.
     * @returns {MySql} An instance of the MySql class.
     */
    static instance(dependee) {

        if (dependee.mySqlInstance) {
            return dependee.mySqlInstance;
        }

        if (!dependee.appConfig) {
            console.error("this.appConfig required on: ", dependee);
        }

        return dependee.mySqlInstance = new this(dependee.appConfig);
    }

    /**
     * Executes a SQL query on the database.
     * @param {string} query - The SQL query to execute.
     * @param {Array} values - Optional values to replace placeholders in the query.
     * @returns {Promise<Array|object>} The query result.
     */
    async query(query, values) {
        return new Promise(
            async (resolve, reject) => {
                (await this.connection).query(query, values, function (error, result, fields) {
                    if (error) throw error;
                    resolve(result);
                });
            }
        );
    };

    /**
     * Formats a date object to an ISO-like local string representation.
     * @param {Date} date - The date to format.
     * @returns {string} The formatted date string.
     */
    getISOLocalString(date) {
        let tzo = -date.getTimezoneOffset();

        if (tzo === 0) {
            return date.toISOString();
        } else {

            let pad = function (num, digits = 2) {
                return String(num).padStart(digits, "0");
            };

            return date.getFullYear() +
                '-' + pad(date.getMonth() + 1) +
                '-' + pad(date.getDate()) +
                ' ' + pad(date.getHours()) +
                ':' + pad(date.getMinutes()) +
                ':' + pad(date.getSeconds());

        }
    }
}

module.exports = MySql;
