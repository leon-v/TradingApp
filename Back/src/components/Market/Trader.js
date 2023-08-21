const MySql = require("../DB/MySql");
const IndependentReserveApi = require("../IndependentReserve/IndependentReserve");
const globalEvents = require("../Events/Global");
const AWSSecrets = require("../AwsSecrets/AwsSecrets");

class Trader {

    constructor(appConfig) {
        this.appConfig = appConfig;

        this.secrets = new AWSSecrets(this.appConfig);

        globalEvents.on('Price Change', this.priceChange.bind(this));
        // globalEvents.on('Price Check', this.priceChange.bind(this));

        this.updateHoldings();
        this.interval = setInterval(function (self) {
            self.updateHoldings();
        }, 60000, this);
    }

    get ir() {
        return IndependentReserveApi.instance(this);
    }
    get db() {
        return MySql.instance(this);
    }

    splitKeys(json) {
        const result = {};
        for (const key in json) {
            const parts = key.split('.');
            let currentObj = result;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!currentObj[part]) {
                    currentObj[part] = {};
                }
                if (i === parts.length - 1) {
                    currentObj[part] = json[key];
                }
                currentObj = currentObj[part];
            }
        }
        return result;
    }

    async getConfig() {
        const appConfig = await this.secrets.getSecretValue(this.appConfig.secretsKey);
        return this.splitKeys(appConfig);
    }

    async priceChange() {

        const config = await this.getConfig();

        if (!config.trade) {
            console.log('No trade config found.');
            return;
        }

        let index = 0;
        for (index in config.trade) {
            await this.processTradeConfig(index, config.trade[index]);
        }

    }

    async processTradeConfig(index, config) {

        console.log("Checking trade " + index);

        if (!config.delay) {
            console.log("   Missing delay, skipping.");
            return;
        }

        // Get the aggregate data based on the config.
        let result = await this.db.query(`
            SELECT
                COUNT(*) AS count,
                SUM(\`change\`) AS \`change\`,
                SUM(trend) AS trend
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL ? SECOND
        `, [
            parseInt(config.delay)
        ]);

        let data = result[0] || null;

        if (!this.check(config, data, "count")) {
            console.log("   Checked failed. Skipping.")
            return;
        }

        if (!this.check(config, data, "change")) {
            console.log("   Checked failed. Skipping.")
            return;
        }

        if (!this.check(config, data, "trend")) {
            console.log("   Checks failed. Skipping.")
            return;
        }

        if (!config.type) {
            console.log("   No type (buy/sell) specified. Skipping.");
            return;
        }

        console.log("EXECUTING TRADE");

        await this.executeTrade(index, config);
    }

    async executeTrade(index, config){

        let tradeCurrency = null;
        let orderType = null;
        let toTradeCurrencyType = null;

        switch (config.type) {
            case "buy":
                tradeCurrency = this.appConfig.secrets.secondaryCurrency;
                orderType = "MarketBid";
                toTradeCurrencyType = "Secondary";
                break;
            case "sell":
                tradeCurrency = this.appConfig.secrets.primaryCurrency;
                orderType = "MarketOffer";
                toTradeCurrencyType = "Primary";
                break;
        }

        let toTrade = await this.getAvailableBalance(tradeCurrency);

        console.log(toTrade);

        if (!toTrade) {
            console.log("   Unable to trade with '" + toTrade + "' '" + tradeCurrency + "'");
            return;
        }

        if (config.fraction) {
            toTrade *= parseFloat(config.fraction);
        }

        console.log("Placing market order to buy '" + toTrade + "' '" + tradeCurrency + "'");
        let result = null;
        try{
            result = await this.ir.placeMarketOrder(orderType, toTrade, toTradeCurrencyType);
        } catch (error) {
            console.warn("placeMarketOrder error: " + error.message, error);
        }

        await this.updateHoldings();

        console.log("EXECUTED TRADE " + index + ". ", config, result);
    }


    check(config, data, property) {

        console.log("   Checking " + property + ". Config=" + config[property] + ", Data=" + data[property]);

        if (typeof (config[property]) == 'undefined' || config[property] === '') {
            console.log("       Config " + property + " '" + config[property] + "' invalid. Skipping (pass)");
            return true;
        }

        if (typeof (data[property]) == 'undefined' || data[property] === null) {
            console.log("       Data " + property + " '" + data[property] + "' invalid. Fail.");
            return false;
        }

        let configValue = config[property];
        let dataValue = data[property];

        switch (property) {
            case "change":
                configValue = parseFloat(configValue);
                dataValue = parseFloat(dataValue);
                break;

            default:
                configValue = parseInt(configValue);
                dataValue = parseInt(dataValue);
                break;
        }

        if (configValue < 0) {
            if (dataValue > configValue) {
                console.log("       " + property + " " + dataValue + " over the config value " + configValue + " Fail.");
                return false;
            }
        }

        else if (configValue > 0) {
            if (dataValue < configValue) {
                console.log("       " + property + " " + dataValue + " under the config value " + configValue + " Fail.");
                return false;
            }
        }

        console.log("   Pass");

        return true;
    }

    async getAvailableBalance(currency) {

        // Get the aggregate data based on the config.
        let result = await this.db.query(`
            SELECT
                SUM(availableBalance) AS availableBalance
            FROM Accounts
            WHERE currencyCode = ?
        `, [
            currency
        ]);

        return parseFloat(result[0].availableBalance);
    }

    async updateHoldings() {

        let accounts = await this.ir.getAccounts();

        if (!accounts) {
            return;
        }

        let index = 0;
        for (index in accounts) {
            await this.updateHoldingAccount(accounts[index]);
        }

    }

    async updateHoldingAccount(account) {

        this.db.query(`
            INSERT INTO Accounts
            (guid, currencyCode, status, totalBalance, availableBalance)
                VALUES
            (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = ?,
                totalBalance = ?,
                availableBalance = ?
        `, [
            account.accountGuid,
            account.currencyCode,
            account.accountStatus,
            account.totalBalance,
            account.availableBalance,
            account.accountStatus,
            account.totalBalance,
            account.availableBalance,
        ]);
    }
}

module.exports = Trader;