const HTTPServer = require("../HttpServer/HttpServer");
const MySql = require("../DB/MySql");

class MarketHistory {

    constructor(appConfig) {
        this.appConfig = appConfig;

        // Map /GetMarketHistory tp this.getResponseData()
        HTTPServer.instance(this).addRoute('/api/MarketHistory/*', this.getResponseData.bind(this), 'GET');
    }

    get ir() {
        return IndependentReserve.instance(this);
    }
    get db() {
        return MySql.instance(this);
    }

    parseIntOrFallback(value, fallback) {
        return Number.isInteger(parseInt(value)) ? parseInt(value) : fallback;
    }

    async getResponseData(request, response) {

        switch (request.urlPathSuffix) {
            case '/last':
                return await this.getLast(request.queryParams);
                break;
            case '/change':
                return await this.getChange(request.queryParams);
                break;
            case '/trend':
                return await this.getTrend(request.queryParams);
                break;
            case '/delay':
                return await this.getDelay(request.queryParams);
                break;
        }
    }

    getQueryFilter(params) {

        // offsetDays:

        return {
            where: `
                WHERE type = 'Market'
                AND \`timestamp\` > NOW()

                    - INTERVAL ? DAY
                    - INTERVAL ? HOUR
                    - INTERVAL ? MINUTE

                    - INTERVAL ? DAY
                    - INTERVAL ? HOUR
                    - INTERVAL ? MINUTE
                AND \`timestamp\` < NOW()
                    - INTERVAL ? DAY
                    - INTERVAL ? HOUR
                    - INTERVAL ? MINUTE

            `,
            values: [
                this.parseIntOrFallback(params.offsetDays, 0),
                this.parseIntOrFallback(params.offsetHours, 0),
                this.parseIntOrFallback(params.offsetMinutes, 0),

                this.parseIntOrFallback(params.rangeDays, 0),
                this.parseIntOrFallback(params.rangeHours, 8),
                this.parseIntOrFallback(params.rangeMinutes, 0),

                this.parseIntOrFallback(params.offsetDays, 0),
                this.parseIntOrFallback(params.offsetHours, 0),
                this.parseIntOrFallback(params.offsetMinutes, 0),


            ]
        }
    }

    async getLast(params) {

        const filter = this.getQueryFilter(params);

        let data = await this.db.query(`
            SELECT
                timestamp,
                last AS value
            FROM MarketPriceHistory` + filter.where,
            filter.values);

        let index = 0;
        for (index in data) {
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        return this.reduceKeys(data);
    }

    async getChange(params) {

        const filter = this.getQueryFilter(params);

        let data = await this.db.query(`
            SELECT
                timestamp,
                \`change\` AS value
            FROM MarketPriceHistory` + filter.where,
            filter.values);

        let index = 0;
        for (index in data) {
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        return this.reduceKeys(data);
    }

    async getTrend(params) {

        const filter = this.getQueryFilter(params);

        let data = await this.db.query(`
            SELECT
                timestamp,
                trend AS value
            FROM MarketPriceHistory` + filter.where,
            filter.values);

        let index = 0;
        let cumulative = 0;
        for (index in data) {
            cumulative += data[index].value;
            data[index].value = cumulative;
            data[index].timestamp = new Date(data[index].timestamp).getTime() / 1000
        }

        return this.reduceKeys(data);
    }

    async getDelay(params) {

        const filter = this.getQueryFilter(params);

        let data = await this.db.query(`
            SELECT
                timestamp,
                delay AS value
            FROM MarketPriceHistory` + filter.where,
            filter.values);

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