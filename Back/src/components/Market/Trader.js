const MySql = require("../DB/MySql");
const IndependentReserveApi = require("../IndependentReserve/IndependentReserve");
const globalEvents = require("../Events/Global");

class Trader {

    constructor(appConfig) {
        this.appConfig = appConfig;

        // globalEvents.on('Price Change', this.priceChange.bind(this));
        globalEvents.on('Price Check', this.priceChange.bind(this));
    }

    get ir() {
        return IndependentReserveApi.instance(this);
    }
    get db() {
        return MySql.instance(this);
    }

    async priceChange() {

        // Check the latest data in SQL for a change in data
        let result = await this.db.query(`
                SELECT
                COUNT(*) AS count,
                SUM(\`change\`) AS \`change\`,
                SUM(trend) AS trend
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL 30 SECOND
        `);

        let summary = result[0] || null;

        if(!summary) {
            return;
        }

        this.checkSell(summary);

        // this.checkBuy(summary);


    }

    checkSell(summary){

        console.log(summary);
        console.log(
            this.appConfig.secrets['Sell:Change'],
            this.appConfig.secrets['Sell:Change'],
            this.appConfig.secrets['Sell:Delay'],
        );


    }
}

module.exports = Trader;