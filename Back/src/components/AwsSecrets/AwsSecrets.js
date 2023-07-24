const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

class AWSSecrets {
    constructor(appConfig) {
        this.appConfig = appConfig;
        this.client = new SecretsManagerClient({ region: this.appConfig.awsRegion });
    }

    async getSecretValue(secretId) {
        const params = {
            SecretId: secretId,
        };

        try {
            const command = new GetSecretValueCommand(params);
            const response = await this.client.send(command);
            return this.parseSecretData(response);
        } catch (err) {
            throw new Error(`Error retrieving secret: ${err.message}`);
        }
    }

    parseSecretData(data) {
        if ('SecretString' in data) {
            return JSON.parse(data.SecretString);
        } else if ('SecretBinary' in data) {
            return data.SecretBinary;
        } else {
            throw new Error('Unexpected response from Secrets Manager.');
        }
    }
}
module.exports = AWSSecrets;
