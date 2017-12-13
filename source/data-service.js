/**
 * Сервис, получающий данные с сервера и сохраняющий их на сервер
 */

import Model from "./model";

export default class DataService {

    constructor(resource) {
        this.resource = resource;
        this.url = 'http://localhost:8888/';
    }

    /**
     * Получение данных с сервера
     *
     * @return {*}
     */
    getData() {
        return this.makeRequest('GET', this.url + this.resource);
    }

    /**
     * Отправка данных на сервер
     *
     * @param model
     * @return {*}
     */
    postData(model) {
        return this.makeRequest('POST', this.url + this.resource, model);
    }

    /**
     * Создание HTTP-запроса
     *
     * @param method
     * @param url
     * @param model
     * @return {Promise}
     */
    makeRequest(method, url, model) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status === 200) {
                    try {
                        let json = JSON.parse(xhr.response);
                        resolve(new Model(json));
                    } catch (err) {
                        reject({
                            status: this.status,
                            statusText: `${err.name} ${err.message}`
                        });
                    }
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };

            if (model) {
                xhr.send(JSON.stringify(model.data, null, 2));
            } else {
                xhr.send();
            }

        });
    }
}
