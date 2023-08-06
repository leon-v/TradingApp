const Url = require('url-parse');

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

        let url = new Url(request.url.replace('//', '/'));
        request.urlPathSegments = url.pathname.split('/');
        request.urlPathSuffix = null;

        let methods = this.routes[url.pathname] || null;

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

            request.urlPathSuffix = url.pathname.substr(pathName.length - 2);

            return methods;
        }

        return null;
    }
    async routeRequest(request, response) {

        console.log(request);

        response.setHeader('Content-Type', 'application/json');

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