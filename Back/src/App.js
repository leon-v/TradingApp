
// const DB = require("./components/DB");
// const IndependentReserve = require("./components/IndependentReserve/API");
const MarketLogger = require("./components/MarketLogger/MarketLogger");
// const HTTPServer = require("./components/HTTPServer");
const GetMarketSummaryEndpoint = require("./components/Endpoint/GetMarketSummary");

process.env.TZ = 'Pacific/Auckland';

const appConfig = {
    awsRegion: "ap-southeast-2",
    secretsKey: "TradingApp",
    database: "TradingApp"
}

// let ir = new IndependentReserve(appConfig);

const marketLogger = new MarketLogger(appConfig);

const getMarketSummary = new GetMarketSummaryEndpoint(appConfig);
// let httpServer = new HTTPServer();


(async () => {
    try {


    } catch (error) {
        throw new Error(`App error: ${error.message}`);
    }
})();
