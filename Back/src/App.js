const MarketLogger = require("./components/MarketLogger/MarketLogger");

const GetMarketSummaryEndpoint = require("./components/Endpoint/GetMarketSummary");
const GetMarketHistory = require("./components/Endpoint/GetMarketHistory");

process.env.TZ = 'Pacific/Auckland';

const appConfig = {
    awsRegion: "ap-southeast-2",
    secretsKey: "TradingApp",
    database: "TradingApp"
}

// let ir = new IndependentReserve(appConfig);

// Start logging data
new MarketLogger(appConfig);

// Create REST endpoints for the FE
new GetMarketSummaryEndpoint(appConfig);
new GetMarketHistory(appConfig);


(async () => {
    try {


    } catch (error) {
        throw new Error(`App error: ${error.message}`);
    }
})();
