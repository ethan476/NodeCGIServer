var fs = require('fs');
var path = require('path');

function HtmlHandler(request, filename, config, callback) {
    fs.readFile(filename, "binary", function(err, data) {
        if (err) {
            callback(err);
        } else {
            callback(false, config["extensions"][path.extname(filename)], data, 200, "binary");
        }
    });
}

exports.handler = HtmlHandler;