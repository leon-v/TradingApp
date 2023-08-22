const MySql = require("../DB/MySql");
const IndependentReserveApi = require("../IndependentReserve/IndependentReserve");
const globalEvents = require("../Events/Global");
const AWSSecrets = require("../AwsSecrets/AwsSecrets");
const Conditions = require("../Conditions/Conditions");

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
        return await this.secrets.getSecretValue(this.appConfig.secretsKey);
    }

    async priceChange() {

        const config = await this.getConfig();

        let simulate = strToBool(config.simulate);

        // DEBUG
        simulate = true;

        const prefix = "Trade ";
        let name = '';
        for (name in config) {

            if (!name.startsWith(prefix)){
                continue;
            }

            console.log(name);

            let tradeName = name.substring(prefix.length);

            let conditions = new Conditions(config[name]);

            await this.processTradeConfig(tradeName, conditions, simulate);
        }
    }

    async processTradeConfig(tradeName, conditions, simulate) {

        console.log("Checking trade: " + tradeName);

        let delay = parseInt(conditions.getValue('delay'));
        if (!delay) {
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
            delay
        ]);

        let data = result[0] || null;

        if (!data) {
            console.log("   Missing data, skipping.");
            return;
        }

        let executeTrade = conditions.compare(data);

        if (!executeTrade) {
            return;
        }

        console.log("EXECUTING TRADE " + tradeName);

        await this.executeTrade(index, conditions, simulate);
    }

    async executeTrade(index, conditions, simulate){

        let tradeCurrency = null;
        let orderType = null;
        let toTradeCurrencyType = null;
        let tradeMin = null;

        let type = conditions.getValue('type');

        switch (type) {
            case "Buy":
                tradeCurrency = this.appConfig.secrets.secondaryCurrency;
                tradeMin = parseFloat(this.appConfig.secrets.secondaryCurrencyMinTrade);
                orderType = "MarketBid";
                toTradeCurrencyType = "Secondary";
                break;
            case "Sell":
                tradeCurrency = this.appConfig.secrets.primaryCurrency;
                tradeMin = parseFloat(this.appConfig.secrets.secondaryCurrencyMinTrade);
                orderType = "MarketOffer";
                toTradeCurrencyType = "Primary";
                break;
            default:
                console.warn("config.type: '" + type + "' not handled.");
                return;
        }

        let availableBalance = await this.getAvailableBalance(tradeCurrency);

        console.log('Available Balance: ' + availableBalance);

        if (!availableBalance || availableBalance <= 0.00) {
            console.log("   Unable to trade with '" + availableBalance + "' '" + tradeCurrency + "'");
            return;
        }

        let toTrade = availableBalance;

        let fraction = conditions.getValue('fraction');
        if (fraction) {
            toTrade *= parseFloat(fraction);
        }

        // Use it all if we are lower than the min.
        if (toTrade <= tradeMin) {
            toTrade = availableBalance;
        }

        console.log("Placing market order to buy '" + toTrade + "' '" + tradeCurrency + "'");
        let result = null;
        try{

            if (!simulate) {
                result = await this.ir.placeMarketOrder(orderType, toTrade, toTradeCurrencyType);
            }
            else{
                console.log("SIMULATED SUCCESS", orderType, toTrade, toTradeCurrencyType);
                result = {
                    orderGuid: 'SIMULATED',
                    createdTimestampUtc: (new Date()).toISOString(),
                    type: orderType,
                    volumeOrdered: toTrade,
                    volumeFilled: toTrade,
                    price: null,
                    avgPrice: null,
                    reservedAmount: toTrade,
                    status: 'Open',
                    primaryCurrencyCode: this.appConfig.primaryCurrency,
                    secondaryCurrencyCode: this.appConfig.secondaryCurrency,
                    feePercent: 0.005,
                    volumeCurrencyType: toTradeCurrencyType
                };
            }
            globalEvents.emit('Executed ' + type);

        } catch (error) {
            console.warn("placeMarketOrder error: " + error.message, error);
        }

        await this.updateHoldings();

        console.log("EXECUTED TRADE " + index + ". ", config, result);
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