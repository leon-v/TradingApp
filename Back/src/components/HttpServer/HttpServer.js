const Url = require('url-parse');

class HTTPServer {

    constructor(appConfig) {
        this.appConfig = appConfig;
        this.hostname = 'localhost';
        this.port = 3080;
        this.routes = {};

        this.http = require('http');

        this.server = this.http.createServer(this.routeRequest.bind(this));

        this.server.module = this;

        this.server.listen(this.port, this.hostname, () => {
            console.log(`Server running at http://${this.hostname}:${this.port}/`);
        });
    }

    static instance(dependee) {

        if (this.serverInstance) {
            return this.serverInstance;
        }

        return this.serverInstance = new this(dependee.appConfig);
    }

    async routeRequest(request, response) {

        console.log(request);

        let url = new Url(request.url.replace('//', '/'));

        let func = this.routes[url.pathname] || null;

        response.setHeader('Content-Type', 'application/json');

        if (!func) {
            response.statusCode = 404;
            response.end(JSON.stringify({
                code: 1,
                message: "No route for URI"
            }));
            return;
        }

        let responseData = await func(request, response);

        response.statusCode = 200;
        response.end(JSON.stringify(responseData));
    }

    addRoute(path, responder) {
        this.routes[path] = responder;
    }
}

module.exports = HTTPServer;