const MySql = require("../DB/MySql");
const IrApi2 = require("../IndependentReserve/Api2");

class Backfiller {

    constructor(appConfig) {
        this.appConfig = appConfig;
    }

    get irApi2(){
        return IrApi2.instance(this);
    }

    /**
     * @return {MySql}
     */
    get db(){
        return MySql.instance(this);
    }

    /**
     *
     * @param {Date} from
     * @param {Date} to
     */
    async fill(from, to) {

        const data = await this.irApi2.getHistory(from, to)

        if (data.s !== "ok") {
            console.error("irApi2 response not OK", data);
        }

        let index = 0;
        for (index in data.t) {

            let time = data.t[index];
            let price = data.o[index];

            let insertData = [
                this.db.getISOLocalString(new Date(time * 1000)),
                price,
            ];

            console.log(time,insertData);

            this.db.query(`
                INSERT IGNORE INTO MarketPriceHistory
                (timestamp, last)
                    VALUES
                (?, ?)
            `, insertData);

        }
    }

}

module.exports = Backfiller;
