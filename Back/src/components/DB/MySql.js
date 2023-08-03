const AWSSecrets = require("../AwsSecrets/AwsSecrets");
const mysql = require("mysql");

class MySql {

    constructor(appConfig) {
        this.appConfig = appConfig;
        this.connectionInstance = null;
    }

    get connection() {

        if (this.connectionInstance) {
            return this.connectionInstance;
        }

        return this.connectionInstance = this.getConnectionInstance();
    }

    async getConnectionInstance() {

        const secrets = new AWSSecrets(this.appConfig);

        const secretValues = await secrets.getSecretValue(this.appConfig.secretsKey);

        const rdsSecretValues = await secrets.getSecretValue(secretValues.rdsSecretsKey);

        // console.log(rdsSecretValues, secretValues);

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

    static instance(dependee) {

        if (dependee.mySqlInstance) {
            return dependee.mySqlInstance;
        }

        if (!dependee.appConfig) {
            console.error("this.appConfig required on: ", dependee);
        }

        return dependee.mySqlInstance = new this(dependee.appConfig);
    }

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

    getISOLocalString(timestamp) {
        let date = new Date(timestamp);
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
