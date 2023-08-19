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

        return this.apiInstance = IRApi(this.appConfig.secrets.IRKey, this.appConfig.secrets.IRSecret);
    }

    async getMarketSummary() {

        return this.api.getMarketSummary({
            primaryCurrencyCode: this.appConfig.secrets.primaryCurrency,
            secondaryCurrencyCode: this.appConfig.secrets.secondaryCurrency
        });
    }

    async placeMarketOrder(orderType, volume, volumeCurrency) {

        return this.api.placeMarketOrder({
            primaryCurrencyCode: this.appConfig.secrets.primaryCurrency,
            secondaryCurrencyCode: this.appConfig.secrets.secondaryCurrency,
            orderType: orderType,
            volume: volume,
            volumeCurrencyType: volumeCurrency
        });
    }

    async getAccounts(){
        return this.api.getAccounts();
    }
}

module.exports = IndependentReserve;