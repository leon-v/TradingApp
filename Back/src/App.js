(async () => {
    const AWSSecrets = require("./components/AwsSecrets/AwsSecrets");

    process.env.TZ = 'Pacific/Auckland';

    const appConfig = {
        awsRegion: "ap-southeast-2",
        secretsKey: "TradingApp",
        database: "TradingApp",
        httpPort: process.env.HTTP_PORT
    }

    const secrets = new AWSSecrets(appConfig);
    appConfig.secrets = await secrets.getSecretValue(appConfig.secretsKey);

    // Create REST endpoints for the FE
    const MarketSummaryApiEndpoint = require("./components/ApiEndpoints/MarketSummary");
    const MarketHistoryApiEndpoint = require("./components/ApiEndpoints/MarketHistory");

    new MarketSummaryApiEndpoint(appConfig);
    new MarketHistoryApiEndpoint(appConfig);

    // const Backfiller = require("./components/MarketRecorder/Backfiller");
    // const backfiller = new Backfiller(appConfig);
    // const from = new Date('2017-01-01 00:00:00');
    // const to = new Date('2018-01-01 00:00:00');
    // console.log(backfiller.fill(from, to));

    // const globalEvents = require("./components/Events/Global");

    // globalEvents.on('priceCheck', function(){
    //     console.log('priceCheck event fired');
    // })

    // Start the market trader listener.
    const MarketTrader = require("./components/Market/Trader");
    const marketTrader = new MarketTrader(appConfig);


    // Start logging data
    const MarketLogger = require("./components/Market/Logger");
    new MarketLogger(appConfig);

    try {


    } catch (error) {
        throw new Error(`App error: ${error.message}`);
    }
})();
