/**
 * Маршрутизация запросов
 *
 * 1. "/" - транслируется в 'index.html'
 * 2. "*.html", "*.js" - по GET-запросу отдаются файлы из директории backend
 * 3. В URL указан ресурс (расширения нет) - по GET-запросу отдаются JSON-файлы из директории backend/data
 * 4.                                      - по POST-запросу сохраняется POST-контент
 */

var path = require('path');
var requestHandler = require('./request-handler');

function route(pathname, method, postData, response) {
    if ((pathname === '/' || path.extname(pathname) !== '') && (method === 'GET')) {
        requestHandler.staticGet(response, pathname);
    } else if ((path.extname(pathname) === '') && (method === 'GET')) {
        requestHandler.dataGet(response, pathname);
    } else if ((path.extname(pathname) === '') && (method === 'POST')) {
        requestHandler.dataPost(response, pathname, postData);
    } else {
        requestHandler.responseError(501, response, pathname, method);
    }
}

exports.route = route;

