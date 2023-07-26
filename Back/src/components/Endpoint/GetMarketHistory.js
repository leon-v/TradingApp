const HTTPServer = require("../HttpServer/HttpServer");
const MySql = require("../DB/MySql");

class GetMarketHistory {

    constructor(appConfig) {
        this.appConfig = appConfig;

        // Map /GetMarketHistory tp this.getResponseData()
        HTTPServer.instance(this).addRoute('/GetMarketHistory', this.getResponseData.bind(this));
    }

    get ir(){
        return IndependentReserve.instance(this);
    }
    get db(){
        return MySql.instance(this);
    }

    async getResponseData(request, response){

        return await this.db.query(`
            SELECT *
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL 1 WEEK
        `);
    }
}

module.exports = GetMarketHistory;