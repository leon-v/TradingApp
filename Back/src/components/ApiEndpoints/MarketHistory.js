const HTTPServer = require("../HttpServer/HttpServer");
const MySql = require("../DB/MySql");

/**
 * Class for serving market history API data.
 */
class MarketHistory {

     /**
     * Creates a new instance of the MarketHistory class.
     * @param {object} appConfig - The application configuration object.
     */
    constructor(appConfig) {
        this.appConfig = appConfig;

        // Map /GetMarketHistory tp this.getResponseData()
        HTTPServer.instance(this).addRoute('/api/MarketHistory/*', this.getResponseData.bind(this), 'GET');
    }

     /**
     * Returns the instance of IndependentReserve associated with this class.
     * @returns {IndependentReserve} The IndependentReserve instance.
     */
    get ir() {
        return IndependentReserve.instance(this);
    }

    /**
     * Returns the instance of MySql associated with this class.
     * @returns {MySql} The MySql instance.
     */
    get db() {
        return MySql.instance(this);
    }

    /**
     * Handles the incoming request and returns the corresponding response data.
     * @param {object} request - The incoming HTTP request object.
     * @param {object} response - The HTTP response object.
     * @returns {Promise<object>} The response data based on the requested URL path suffix.
     */
    async getResponseData(request, response) {

        switch (request.urlPathSuffix) {
            case '/last':
                return await this.getLast(request.queryParams);

            case '/change':
                return await this.getChange(request.queryParams);

            case '/trend':
                return await this.getTrend(request.queryParams);

            case '/delay':
                return await this.getDelay(request.queryParams);

        }
    }

    /**
     * Constructs a query filter object based on the provided parameters.
     * @param {object} params - The query parameters.
     * @returns {object} The query filter object.
     */
    getQueryFilter(params) {

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
                global.parseIntOrFallback(params.offsetDays, 0),
                global.parseIntOrFallback(params.offsetHours, 0),
                global.parseIntOrFallback(params.offsetMinutes, 0),

                global.parseIntOrFallback(params.rangeDays, 0),
                global.parseIntOrFallback(params.rangeHours, 8),
                global.parseIntOrFallback(params.rangeMinutes, 0),

                global.parseIntOrFallback(params.offsetDays, 0),
                global.parseIntOrFallback(params.offsetHours, 0),
                global.parseIntOrFallback(params.offsetMinutes, 0),
            ]
        }
    }

    /**
     * Retrieves the last market data based on the provided parameters.
     * @param {object} params - The query parameters.
     * @returns {Promise<object>} The retrieved market data.
     */
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

    /**
     * Retrieves market change data based on the provided parameters.
     * @param {object} params - The query parameters.
     * @returns {Promise<object>} The retrieved market change data.
     */
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

    /**
     * Retrieves market trend data based on the provided parameters.
     * @param {object} params - The query parameters.
     * @returns {Promise<object>} The retrieved market trend data.
     */
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

    /**
     * Retrieves market delay data based on the provided parameters.
     * @param {object} params - The query parameters.
     * @returns {Promise<object>} The retrieved market delay data.
     */
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

     /**
     * Reduces the keys of an array of data objects.
     * @param {Array<object>} data - The array of data objects.
     * @returns {object} The reduced data object.
     */
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

// Export the MarketHistory class
module.exports = MarketHistory;