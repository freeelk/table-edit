/**
 *  Запуск node.js HTTP сервера
 */

var server = require("./server");
var router = require("./router");

/**
 * Порт, на котором будет запущен сервер
 *
 * @type {number}
 */
const port = 8888;

server.start(router.route, port);



