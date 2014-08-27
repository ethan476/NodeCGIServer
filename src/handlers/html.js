var fs = require('fs');

function HtmlHandler(request, filename, config, callback) {
    fs.readFile(filename, "binary", function(err, data) {
        if (err) {
            callback(err);
        } else {
            callback(false, data, 200, "binary");
        }
    });
}

exports.handler = HtmlHandler;