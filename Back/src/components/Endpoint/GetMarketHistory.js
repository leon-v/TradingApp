const HTTPServer = require("../HttpServer/HttpServer");
const MySql = require("../DB/MySql");

class GetMarketHistory {

    constructor(appConfig) {
        this.appConfig = appConfig;

        // Map /GetMarketHistory tp this.getResponseData()
        HTTPServer.instance(this).addRoute('/api/GetMarketHistory', this.getResponseData.bind(this));
    }

    get ir(){
        return IndependentReserve.instance(this);
    }
    get db(){
        return MySql.instance(this);
    }

    async getResponseData(request, response){

        let data = await this.db.query(`
            SELECT *
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL 10 WEEK
        `);

        let index = 0;
        for (index in data) {
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        data = this.reduceKeys(data);

        return data;
    }

    reduceKeys(data) {

        let result = {};
        let index = 0;
        for (index in data) {

            let object = data[index];

            let property = "";
            for (property in object) {

                if (typeof(result[property]) == "undefined") {
                    result[property] = [];
                }

                let length = result[property].length;
                result[property][length] = object[property];
            }
        }

        return result;
    }
}

module.exports = GetMarketHistory;