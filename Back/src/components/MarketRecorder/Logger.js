const MySql = require("../DB/MySql");
const IndependentReserveApi = require("../IndependentReserve/IndependentReserve");

class MarketLogger {

    constructor(appConfig) {
        this.appConfig = appConfig;

        this.lastPrice = null;

        this.log();

        this.interval = setInterval(function(self){
            self.log();
        }, 2000, this);
    }

    get ir(){
        return IndependentReserveApi.instance(this);
    }
    get db(){
        return MySql.instance(this);
    }

    async log() {

        this.debug("Fetching market summary");

        let marketSummary = await this.ir.getMarketSummary('Btc', 'Nzd');

        if (!marketSummary) {
            console.debug("Failed to fetch market summary!");
            return;
        }

        // Check local varaible for change in data.
        if (marketSummary.lastPrice === this.lastPrice) {
            this.debug("No change in last price when checking this.lastPrice");
            return;
        }
        
        this.lastPrice = marketSummary.lastPrice;

        // Check the latest data in SQL for a change in data
        let result = await this.db.query(`
            SELECT last
            FROM MarketPriceHistory
            WHERE \`timestamp\` = (
                SELECT MAX(\`timestamp\`) FROM MarketPriceHistory
            )
        `);

        if ((result[0]) && (result[0].last == marketSummary.lastPrice)) {
            this.debug("No change in last price when checking marketSummary.lastPrice");
            return;
        }

        // The data has changed, record it.
        let isoLocaleTimestamp = this.db.getISOLocalString(marketSummary.createdTimestampUtc);

        this.debug("Last price changed, recording data.");

        this.db.query(`
            INSERT INTO MarketPriceHistory
            (timestamp, last)
                VALUES
            (?, ?)
        `, [
            isoLocaleTimestamp,
            marketSummary.lastPrice,
        ]);

        this.db.query(`
            INSERT INTO MarketPriceDaily
                (date, highest, lowest, volume)
            VALUES
                (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                highest = ?,
                lowest = ?,
                volume = ?
        `, [
            isoLocaleTimestamp,
            marketSummary.dayHighestPrice,
            marketSummary.dayLowestPrice,
            marketSummary.dayVolumeXbt,
            marketSummary.dayHighestPrice,
            marketSummary.dayLowestPrice,
            marketSummary.dayVolumeXbt,
        ]);

        return marketSummary.lastPrice;
    }

    debug(message){
        console.debug(this.constructor.name + ": " + message);
    }
}

module.exports = MarketLogger;
