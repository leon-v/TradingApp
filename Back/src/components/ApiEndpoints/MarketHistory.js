const HTTPServer = require("../HttpServer/HttpServer");
const MySql = require("../DB/MySql");

class MarketHistory {

    constructor(appConfig) {
        this.appConfig = appConfig;

        this.hours = 8;

        // Map /GetMarketHistory tp this.getResponseData()
        HTTPServer.instance(this).addRoute('/api/MarketHistory/*', this.getResponseData.bind(this), 'GET');
    }

    get ir() {
        return IndependentReserve.instance(this);
    }
    get db() {
        return MySql.instance(this);
    }

    async getResponseData(request, response) {

        console.log(request.urlPathSuffix);
        switch (request.urlPathSuffix) {
            case '/last':
                return await this.getLast();
                break;
            case '/change':
                return await this.getChange();
                break;
            case '/trend':
                return await this.getTrend();
                break;
            case '/delay':
                return await this.getDelay();
                break;
        }
    }

    async getLast() {
        let data = await this.db.query(`
            SELECT
                timestamp,
                last AS value
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL ? HOUR
        `, [
            this.hours
        ]);

        let index = 0;
        for (index in data) {
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        return this.reduceKeys(data);
    }

    async getChange() {
        let data = await this.db.query(`
            SELECT
                timestamp,
                \`change\` AS value
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL ? HOUR
        `, [
            this.hours
        ]);

        let index = 0;
        for (index in data) {
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        return this.reduceKeys(data);
    }

    async getTrend() {
        let data = await this.db.query(`
            SELECT
                timestamp,
                trend AS value
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL ? HOUR
        `, [
            this.hours
        ]);

        let index = 0;
        let cumulative = 0;
        for (index in data) {
            cumulative += data[index].value;
            data[index].value = cumulative;
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        return this.reduceKeys(data);
    }

    async getDelay() {

        let data = await this.db.query(`
            SELECT
                timestamp,
                delay AS value
            FROM MarketPriceHistory
            WHERE timestamp > NOW() - INTERVAL ? HOUR
        `, [
            this.hours
        ]);

        let index = 0;
        for (index in data) {
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        return this.reduceKeys(data);
    }

    reduceKeys(data) {

        let result = {};
        let index = 0;
        for (index in data) {

            let object = data[index];

            let property = "";
            for (property in object) {

                if (typeof (result[property]) == "undefined") {
                    result[property] = [];
                }

                let length = result[property].length;
                result[property][length] = object[property];
            }
        }

        return result;
    }
}

module.exports = MarketHistory;