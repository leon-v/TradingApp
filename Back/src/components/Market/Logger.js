const MySql = require("../DB/MySql");
const IndependentReserveApi = require("../IndependentReserve/IndependentReserve");
const globalEvents = require("../Events/Global");

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

        // this.debug("Fetching market summary");

        let marketSummary = await this.ir.getMarketSummary();

        if (!marketSummary) {
            this.debug("Failed to fetch market summary!");
            return;
        }

        globalEvents.emit('Price Check');

        // Check local varaible for change in data.
        if (marketSummary.lastPrice === this.lastPrice) {
            // this.debug("No change in last price when checking this.lastPrice");
            return;
        }

        this.lastPrice = marketSummary.lastPrice;

        // Check the latest data in SQL for a change in data
        let result = await this.db.query(`
            SELECT timestamp, last
            FROM MarketPriceHistory
            WHERE \`timestamp\` = (
                SELECT MAX(\`timestamp\`) FROM MarketPriceHistory
            )
        `);

        let previousMarketSummary = result[0] || null;

        if ((previousMarketSummary) && (previousMarketSummary.last == marketSummary.lastPrice)) {
            this.debug("No change in last price when checking marketSummary.lastPrice");
            return;
        }

        // The data has changed, record it.
        let isoLocaleTimestamp = this.db.getISOLocalString(marketSummary.createdTimestampUtc);

        let currentDateTime = new Date(isoLocaleTimestamp);
        let previousDateTime = currentDateTime;

        if (previousMarketSummary && previousMarketSummary.timestamp) {
            previousDateTime = new Date(previousMarketSummary.timestamp);
        }

        let delay = (currentDateTime.getTime() - previousDateTime.getTime()) / 1000;

        let change = 0
        if (previousMarketSummary && previousMarketSummary.last) {
            change = marketSummary.lastPrice - previousMarketSummary.last;
        }

        let trend = Math.sign(change);

        this.debug("Last price changed, recording data.");
        this.debug("change: " + change);
        this.debug("trend: " + trend);
        this.debug("delay: " + delay);

        this.db.query(`
            INSERT INTO MarketPriceHistory
            (timestamp, last, \`change\`, trend, delay)
                VALUES
            (?, ?, ?, ?, ?)
        `, [
            isoLocaleTimestamp,
            marketSummary.lastPrice,
            change,
            trend,
            delay
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

        globalEvents.emit('Price Change');

        return marketSummary.lastPrice;
    }

    debug(message){
        console.debug(this.constructor.name + ": ", message);
    }
}

module.exports = MarketLogger;
