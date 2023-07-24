const MySql = require("../DB/MySql");
const IndependentReserveApi = require("../IndependentReserve/IndependentReserve");

class MarketLogger {

    constructor(appConfig) {
        this.appConfig = appConfig;

        this.log();
        this.interval = setInterval(function(self){
            self.log();
        }, 15000, this);
    }

    get ir(){
        return IndependentReserveApi.instance(this);
    }
    get db(){
        return MySql.instance(this);
    }

    async log() {

        let marketSummary = await this.ir.getMarketSummary('Btc', 'Nzd');

        if (!marketSummary) {
            return;
        }

        let result = await this.db.query(`
            SELECT last
            FROM MarketPriceHistory
            WHERE \`timestamp\` = (
                SELECT MAX(\`timestamp\`) FROM MarketPriceHistory
            )
        `);

        if ((result[0]) && (result[0].last == marketSummary.lastPrice)) {
            return;
        }

        console.log(marketSummary);

        let isoLocaleTimestamp = this.db.getISOLocalString(marketSummary.createdTimestampUtc);

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
    }
}

module.exports = MarketLogger;
