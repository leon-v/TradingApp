const MarketLogger = require("./components/MarketRecorder/Logger");

const GetMarketSummaryEndpoint = require("./components/Endpoint/GetMarketSummary");
const GetMarketHistory = require("./components/Endpoint/GetMarketHistory");
// const Backfiller = require("./components/MarketRecorder/Backfiller");


process.env.TZ = 'Pacific/Auckland';

const appConfig = {
    awsRegion: "ap-southeast-2",
    secretsKey: "TradingApp",
    database: "TradingApp",
    httpPort: process.env.HTTP_PORT
}

// Create REST endpoints for the FE
new GetMarketSummaryEndpoint(appConfig);
new GetMarketHistory(appConfig);

// const backfiller = new Backfiller(appConfig);

// const from = new Date('2017-01-01 00:00:00');
// const to = new Date('2018-01-01 00:00:00');
// console.log(backfiller.fill(from, to));


// Start logging data
new MarketLogger(appConfig);

(async () => {
    try {


    } catch (error) {
        throw new Error(`App error: ${error.message}`);
    }
})();
