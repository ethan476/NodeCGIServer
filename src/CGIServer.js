var fs = require("fs");
var http = require("http");
var path = require("path");
var url = require("url");

function CGIServer(configurationFile, port) {
    this.config = require(configurationFile);
    this.port = port;

    this.startServer = function() {
        var self = this;
        http.createServer(function(request, response) {
            self.findPath(request, function(err, uri, filename) {
                if (err) {
                    self.errorPage(request, response, 404);
                } else {
                    self.processRequest(request, filename, function(err, headers, data, resp, type) {
                        if (err) {
                            self.errorPage(request, response, 500);
                        } else {
                            response.writeHead(resp, headers);
                            response.write(data, type);
                            response.end();
                        }
                    });
                }
            });
        }).listen(this.port);
    };
}

CGIServer.prototype.processRequest = function(request, filename, callback) {
    var self = this;
    if (typeof self.config["extensions"][path.extname(filename)] !== "undefined") {
        var subHandlerPath = self.config["handlersPath"] + "/" + self.config["extensions"][path.extname(filename)]["internal"] + ".js";
        fs.exists(subHandlerPath, function(exists) {
            if (exists) {
                var subHandler = require(subHandlerPath);
                subHandler.handler(request, filename, self.config, function(err, headers, data, resp, type) {
                    if (err) {
                        callback(true, headers, data, resp, type);
                    } else {
                        callback(false, headers, data, resp, type);
                    }
                });
            } else {
                //throw new Error("Handler: " + self.config["extensions"][path.extname(filename)]["internal"] + " not found.");
                callback(true);
            }
        });
    } else {
        // Add real err 
        callback(true);
    }
};

CGIServer.prototype.errorPage = function(request, response, code) {
    var self = this;
    if (code === 500) {
        fs.exists(self.config["errorPagesPath"] + "/500.html", function(exists) {
            if (exists) {
                fs.readFile(self.config["errorPagesPath"] + "/500.html", function(err, data) {
                    if (err) {
                        response.writeHead(code, {
                            'Content-type': "text/html"
                        });
                        response.write("Error: " + code);
                        response.end();
                    } else {
                        response.writeHead(code, {
                            'Content-type': self.config["extensions"][".html"]['mime']
                        });
                        response.write(data);
                        response.end();
                    }
                });
            } else {
                response.writeHead(code, {
                    'Content-type': "text/html"
                });
                response.write("Error: " + code);
                response.end();
            }
        });
    } else {
        fs.readdir(self.config["errorPagesPath"], function(err, files) {
            for (var i = 0; i < files.length; i++) {
                if (files[i].startsWith(String(code))) {
                    self.processRequest(request, self.config["errorPagesPath"] + "/" + files[i], function(err, headers, data, resp, type) {
                        if (err) {
                            self.errorPage(request, response, 500);
                        } else {
                            response.writeHead(code, headers);
                            response.write(data, type);
                            response.end();
                        }
                    });
                } else if ((i + 1) === files.length) {
                    response.writeHead(code, {
                        'Content-type': "text/html"
                    });
                    response.write("Error: " + code);
                    response.end();
                }
                break;
            }
        });
    }
}

CGIServer.prototype.findPath = function(request, callback) {
    try {
        var uri = url.parse(request.url).pathname;
        var filename = path.join(this.config["docroot"], uri);

        if (fs.lstatSync(filename).isDirectory()) {
            uri += this.config["indexFile"];
        }

        if (!fs.existsSync(filename)) {
            console.log(uri);
            callback(true, uri, filename);
        } else {
            console.log(uri);
            callback(false, uri, filename);
        }
    } catch (err) {
        callback(err, uri, filename);
    }
};

CGIServer.prototype.listen = function(port) {
    this.port = port;
    this.startServer();
};

CGIServer.parseOutputData = function(data, callback) {
    var headers = data.split(/((\r)?\n(\r)?\n)/)[0];
    var data = data.substr(headers.length + 1);
    callback(headers, data);
}

/* Other Stuff */
if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
        return str.length > 0 && this.substring(0, str.length) === str;
    }
}


if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function(str) {
        return str.length > 0 && this.substring(this.length - str.length, this.length) === str;
    }
}

global.CGIServer = CGIServer;