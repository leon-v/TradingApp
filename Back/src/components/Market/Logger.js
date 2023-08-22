const MySql = require("../DB/MySql");
const IndependentReserveApi = require("../IndependentReserve/IndependentReserve");
const globalEvents = require("../Events/Global");

class MarketLogger {

    constructor(appConfig) {
        this.appConfig = appConfig;

        this.lastPrice = null;

        this.log();

        this.interval = setInterval(function (self) {
            self.log();
        }, 2000, this);

        globalEvents.on('Executed Buy', this.logTradeBuy.bind(this));
        globalEvents.on('Executed Sell', this.logTradeSell.bind(this));
    }

    get ir() {
        return IndependentReserveApi.instance(this);
    }
    get db() {
        return MySql.instance(this);
    }

    async logTradeBuy(){
        // -1 to adjust for the market change after my buy brings the price up.
        // This is so the next price change doesn't cause a feedback loop.
        await this.logTrade(-1);
    }

    async logTradeSell(){
        // +1 to adjust for the market change after mt sell brings the price down.
        // This is so the next price change doesn't cause a feedback loop.
        await this.logTrade(1);
    }

    async logTrade(trend) {

        // Check the latest data in SQL for a change in data
        let result = await this.db.query(`
            SELECT timestamp, last
            FROM MarketPriceHistory
            WHERE \`timestamp\` = (
                SELECT MAX(\`timestamp\`) FROM MarketPriceHistory
            )
            AND type = 'Market'
        `);

        let previousMarketSummary = result[0] || null;

        if (!previousMarketSummary) {
            console.warn('previousMarketSummary missing');
            return;
        }

        let currentDateTime = new Date();
        let previousDateTime = new Date(previousMarketSummary.timestamp);

        let delay = (currentDateTime.getTime() - previousDateTime.getTime()) / 1000;

        this.db.query(`
            INSERT INTO MarketPriceHistory
            (timestamp, type, last, \`change\`, trend, delay)
                VALUES
            (?, ?, ?, ?, ?, ?)
        `, [
            this.db.getISOLocalString(currentDateTime),
            'Trade',
            previousMarketSummary.last,
            0,
            trend,
            delay
        ]);

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
            WHERE \`type\` = 'Market'
            AND \`timestamp\` = (
                SELECT MAX(\`timestamp\`) FROM MarketPriceHistory
            )
        `);

        let previousMarketSummary = result[0] || null;

        if ((previousMarketSummary) && (previousMarketSummary.last == marketSummary.lastPrice)) {
            this.debug("No change in last price when checking marketSummary.lastPrice");
            return;
        }

        // The data has changed, record it.
        let isoLocaleTimestamp = this.db.getISOLocalString(new Date(marketSummary.createdTimestampUtc));

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

        change = this.round(change, 8);

        let trend = Math.sign(change);

        this.debug("Last price changed, recording data.");
        this.debug("change: " + change);
        this.debug("trend: " + trend);
        this.debug("delay: " + delay);

        await this.db.query(`
            INSERT INTO MarketPriceHistory
            (timestamp, type, last, \`change\`, trend, delay)
                VALUES
            (?, 'Market', ?, ?, ?, ?)
        `, [
            isoLocaleTimestamp,
            marketSummary.lastPrice,
            change,
            trend,
            delay
        ]);

        await this.db.query(`
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

    round(number, decimalPlaces) {
        const factor = 10 ** decimalPlaces;
        return Math.round(number * factor) / factor;
    }

    debug(message) {
        console.debug(this.constructor.name + ": ", message);
    }
}

module.exports = MarketLogger;
