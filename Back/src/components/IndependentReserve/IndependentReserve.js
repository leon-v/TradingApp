const AWSSecrets = require("../AwsSecrets/AwsSecrets");
const IRApi = require("ir-api");

class IndependentReserve {

    constructor(appConfig) {
        this.appConfig = appConfig;
        this.apiInstance = null;
    }

    static instance(dependee) {

        if (dependee.independentReserveInstance) {
            return dependee.independentReserveInstance;
        }

        if (!dependee.appConfig) {
            console.error("this.appConfig required on: ", dependee);
        }

        return dependee.independentReserveInstance = new this(dependee.appConfig);
    }

    get api(){

        if (this.apiInstance) {
            return this.apiInstance;
        }

        const secrets = new AWSSecrets(this.appConfig);
        const secretValues = secrets.getSecretValue(this.appConfig.secretsKey);

        return this.apiInstance = IRApi(secretValues.IRKey, secretValues.IRSecret);
    }

    async getMarketSummary(primaryCurrency, secondaryCurrency) {

        return this.api.getMarketSummary({
            primaryCurrencyCode: primaryCurrency,
            secondaryCurrencyCode: secondaryCurrency
        });
    }
}

module.exports = IndependentReserve;