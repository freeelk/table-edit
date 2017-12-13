/**
 * HTTP-сервер
 */

var http = require("http");
var url = require("url");

function start(route, port) {
    function onRequest(request, response) {
        var postData = "";
        var pathname = url.parse(request.url).pathname;

        console.log("Request for " + pathname + " received.");

        request.setEncoding("utf8");

        request.addListener("data", function (postDataChunk) {
            postData += postDataChunk;
            console.log("Received POST data chunk '" + postDataChunk + "'.");
        });

        request.addListener("end", function () {
            route(pathname, request.method, postData, response);
        });

    }

    http.createServer(onRequest).listen(port);
    console.log("Server has started on http://localhost:" + port);
}

exports.start = start;
