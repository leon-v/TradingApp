const HTTPServer = require("../HttpServer/HttpServer");
const IndependentReserve = require("../IndependentReserve/IndependentReserve");

class GetMarketSummary {

    constructor(appConfig) {
        this.appConfig = appConfig;
        this.httpServer = HTTPServer.instance(this);
        this.httpServer.route('/getMarketSummary', this.getResponseData);
    }

    get ir(){
        return IndependentReserve.instance(this);
    }

    async getResponseData(request, response){
        console.log(this, request, response);
        // return await this.ir.getMarketSummary('Btc', 'Nzd');
    }
}

module.exports = GetMarketSummary;