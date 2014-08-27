var fs = require('fs');
var url = require('url');
var path = require('path');
var cp = require('child_process');
var querystring = require('querystring');

function CgiHandler(request, filename, config, callback) {
    setUpCgiEnv(request, filename, config, function(env) {
        var command = cp.exec("/usr/local/bin/php-cgi -q -c " + config["extensions"][".php"]["iniPath"] + " " + filename, {
            "env": env,
            "timeout": config["timeout"]
        }, function(err, stdout, stderr) {
            if (err !== null) {
                console.log(err);
                callback(err);
            } else {
                CGIServer.parseOutputData(stdout, function(headers, data) {
                    callback(false, headers, data, 200);
                });
            }
        });
    });
}

function setUpCgiEnv(request, filename, config, callback) {
    env = {};
    env['QUERY_STRING'] = querystring.stringify(url.parse(request.url, true).query);
    env['REQUEST_METHOD'] = 'GET';
    env['DOCUMENT_ROOT'] = config["docroot"];
    env['REMOTE_ADDRESS'] = request.connection.remoteAddress;
    env['GATEWAY_INTERFACE'] = 'CGI/1.1';
    env['SERVER_ADDRESS'] = '0.0.0.0';
    env['REQUEST_URI'] = filename;
    env['SCRIPT_NAME'] = path.basename(filename);
    env['SCRIPT_FILENAME'] = filename;
    env['SERVER_PROTOCOL'] = "HTTP/1.1";
    env['SERVER_PORT'] = String(request.socket.localPort);
    env['REDIRECT_STATUS'] = '200';
    callback(env);
}

exports.handler = CgiHandler;