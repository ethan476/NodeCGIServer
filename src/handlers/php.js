var fs = require('fs');
var url = require('url');
var path = require('path');
var cp = require('child_process');
var querystring = require('querystring');

function CgiHandler(request, filename, config, callback) {
    CGIServer.setUpCgiEnv(request, filename, config, function(env) {
        var command = cp.exec("/usr/local/bin/php-cgi -q -c " + config["extensions"][".php"]["iniPath"] + " " + filename, {
            "env": env,
            "timeout": config["timeout"]
        }, function(err, stdout, stderr) {
            if (err !== null) {
                console.log(err);
                callback(err);
            } else {
                CGIServer.parseOutputData(filename, stdout, function( headers, data) {
                    callback(false, headers, data, 200);
                });
            }
        });
    });
}

exports.handler = CgiHandler;