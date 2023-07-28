class Api2 {

    constructor(appConfig) {
        this.appConfig = appConfig;
        this.apiUrl = "https://www.independentreserve.com/api2/trade/udf/";
    }

    static instance(dependee) {

        if (dependee.independentReserveApi2Instance) {
            return dependee.independentReserveApi2Instance;
        }

        if (!dependee.appConfig) {
            console.error("this.appConfig required on: ", dependee);
        }

        return dependee.independentReserveApi2Instance = new this(dependee.appConfig);
    }

    // history?symbol=Btc%2FNzd&resolution=60&from=1690503000&to=1690549771&countback=2&currencyCode=New%20Zealand%20Dollar
    //1690503000
    //1688126400000
    /**
     *
     * @param {Date} from
     * @param {Date} to
     */
    async getHistory(from, to) {

        const query = {
            symbol: "Btc/Nzd",
            resolution: 60,
            from: from.getTime() / 1000,
            to: to.getTime() / 1000,
            countback: 2,
            currencyCode: "New Zealand Dollar"
        };

        // console.log(query);

        const response = await fetch(this.apiUrl + 'history?' + new URLSearchParams(query));
        return await response.json();
    }
}

module.exports = Api2;