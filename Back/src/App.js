const MarketLogger = require("./components/MarketRecorder/Logger");

const MarketSummaryApiEndpoint = require("./components/ApiEndpoints/MarketSummary");
const MarketHistoryApiEndpoint = require("./components/ApiEndpoints/MarketHistory");
// const Backfiller = require("./components/MarketRecorder/Backfiller");


process.env.TZ = 'Pacific/Auckland';

const appConfig = {
    awsRegion: "ap-southeast-2",
    secretsKey: "TradingApp",
    database: "TradingApp",
    httpPort: process.env.HTTP_PORT
}

// Create REST endpoints for the FE
new MarketSummaryApiEndpoint(appConfig);
new MarketHistoryApiEndpoint(appConfig);

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
