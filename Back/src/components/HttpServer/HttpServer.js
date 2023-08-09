const Url = require('url-parse');
const QueryString = require('querystring');

class HTTPServer {

    constructor(appConfig) {
        this.appConfig = appConfig;
        this.hostname = 'localhost';
        this.port = appConfig.httpPort;
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

    getRouteMethods(request) {

        request.urlPathSegments = request.parsedUrl.pathname.split('/');
        request.urlPathSuffix = null;

        let methods = this.routes[request.parsedUrl.pathname] || null;

        if (methods) {
            return methods;
        }

        let wildcardUris = [];
        let wildcardUri = "";
        let index = 0;
        for (index in request.urlPathSegments) {
            wildcardUri = (wildcardUri + "/" + request.urlPathSegments[index]).replace('//', '/');
            wildcardUris.push(wildcardUri + "/*");
        }

        for (index in wildcardUris.reverse()) {
            let pathName = wildcardUris[index];
            methods = this.routes[pathName] || null;

            if (!methods) {
                continue;
            }

            request.urlPathSuffix = request.parsedUrl.pathname.substr(pathName.length - 2);

            return methods;
        }

        return null;
    }
    async routeRequest(request, response) {

        response.setHeader('Content-Type', 'application/json');

        request.parsedUrl = new Url(request.url.replace('//', '/'));

        let methods = this.getRouteMethods(request);

        if (!methods) {
            response.statusCode = 404;
            response.end(JSON.stringify({
                code: 1,
                message: "No route for URI"
            }));
            return;
        }

        let func = methods[request.method] || methods['ALL'] || null;

        if (!func) {
            response.statusCode = 405;
            response.end(JSON.stringify({
                code: 1,
                message: "No route for " + request.method,
            }));
            return;
        }

        request.queryParams = QueryString.parse(request.parsedUrl.query.substring(1));

        let responseData = await func(request, response);

        response.statusCode = 200;
        response.end(JSON.stringify(responseData));
    }

    addRoute(path, responder, httpMethod) {
        httpMethod = httpMethod || "ALL";

        if (!this.routes[path]) {
            this.routes[path] = {};
        }

        this.routes[path][httpMethod] = responder;
    }
}

module.exports = HTTPServer;