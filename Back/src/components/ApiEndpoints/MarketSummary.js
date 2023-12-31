const HTTPServer = require("../HttpServer/HttpServer");
const IndependentReserve = require("../IndependentReserve/IndependentReserve");

class MarketSummary {

    constructor(appConfig) {
        this.appConfig = appConfig;

        // Map /getMarketSummary tp this.getResponseData()
        HTTPServer.instance(this).addRoute('/api/getMarketSummary', this.getResponseData.bind(this));
    }

    get ir(){
        return IndependentReserve.instance(this);
    }

    async getResponseData(request, response){
        return await this.ir.getMarketSummary();
    }
}

module.exports = MarketSummary;