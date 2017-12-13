/**
 * Обработка маршрутов
 */

var fs = require("fs");
var path = require('path');

const pathToDataFiles = 'backend/data';
const pathToStaticFiles = 'build';

const respErrStatuses = {
    "404": "Not found",
    "500": "Server error",
    "501": "Not Implemented",
};

/**
 * Обработка запросов на файлы приложения (html, js)
 *
 * @param response
 * @param pathname
 */
function staticGet(response, pathname) {
    if (pathname === '/') {
        pathname = '/index.html';
    }

    let fileName = pathToStaticFiles + pathname;

    fs.stat(fileName, (err, stat) => {
        if (err == null) {
            fs.readFile(fileName, 'utf8', (err, contents) => {
                if (err) {
                    responseError(500, response, pathname, method);
                } else {
                    let contentType = getContentTypeByExtention(path.extname(pathname));
                    responseOk(contents, response, pathname, 'GET', contentType);
                }
            })
        } else if (err.code == 'ENOENT') {
            responseError(404, response, pathname, 'GET');
        } else {
            responseError(500, response, pathname, 'GET');
        }
    });

}

/**
 * Обработка запросов отправки данных в соответствии с указанным ресурсом
 *
 * @param response
 * @param pathname
 */
function dataGet(response, pathname) {
    const extention = '.json';
    let fileName = pathToDataFiles + pathname + extention;

    fs.stat(fileName, (err, stat) => {
        if (err == null) {
            fs.readFile(fileName, 'utf8', (err, contents) => {
                if (err) {
                    responseError(500, response, pathname, method);
                } else {
                    let contentType = getContentTypeByExtention(extention);
                    responseOk(contents, response, pathname, 'GET', contentType);
                }
            });
        } else if (err.code == 'ENOENT') {
            responseError(404, response, pathname, 'GET');
        } else {
            responseError(500, response, pathname, 'GET');
        }
    });

}


/**
 * Обработка запросов сохранения данных в соответствии с указанным ресурсом
 *
 * @param response
 * @param pathname
 * @param postData
 */
function dataPost(response, pathname, postData) {
    const extention = '.json';
    let fileName = pathToDataFiles + pathname + extention;

    fs.stat(fileName, (err, stat) => {
        if (err == null) {
            fs.writeFile(fileName, postData, (error) => {
                if (err) {
                    responseError(500, response, pathname, method);
                } else {
                    let contentType = getContentTypeByExtention(extention);
                    responseOk(postData, response, pathname, 'POST', contentType);
                }
            });
        } else if (err.code == 'ENOENT') {
            responseError(404, response, pathname, 'POST');
        } else {
            responseError(500, response, pathname, 'POST');
        }
    });

}

/**
 * Ответ сервера - ОК
 *
 * @param contents
 * @param response
 * @param pathname
 * @param method
 * @param contentType
 */
function responseOk(contents, response, pathname, method, contentType) {
    //Access-Control-Allow-Origin - Для тестирования через отдельный сервер - CORS-запрос
    response.writeHead(200, {"Content-Type": contentType + "; charset=UTF-8", "Access-Control-Allow-Origin": "*"});
    response.write(contents);
    response.end();
    console.log(`${method} ${pathname}  OK (200)`);
}


/**
 * Ответ сервера - ошибка
 *
 * @param code
 * @param response
 * @param pathname
 * @param method
 */
function responseError(code, response, pathname, method) {
    response.writeHead(code, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
    response.write(code + ' ' + respErrStatuses[code]);
    response.end();
    console.log(`${method} ${pathname} ERROR (${code})`);
}

function getContentTypeByExtention(ext) {
    switch (ext) {
        case '.html':
            return 'text/html';
            break;
        case '.js':
            return 'application/javascript';
            break;
        case '.json':
            return 'text/json';
            break;
        default:
            return 'text/plain';
            break;
    }
}

exports.staticGet = staticGet;
exports.dataGet = dataGet;
exports.dataPost = dataPost;
exports.responseError = responseError;