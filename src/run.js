require("./CGIServer.js");

var server = new CGIServer("./config.json");
server.listen(8090);
