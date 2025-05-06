// axios提供了5种使用方式，如何实现？
// 01. axios({url, method, headers})
// 02. axios(url, {method, headers})
// 03. axios.get(url, {headers})
// 04. axios.post(url, data, {headers})
// 05. axios.request({url, method, headers})

function mergeConfig(_defaults, config) {
    Object.keys(config).forEach(key => {
        _defaults[key] = config[key]
    })
    return _defaults
}

class Axios {
    constructor(config) {
        this._defaults = config
    }

    request(configOrUrl, config) {
        return this.dispatchRequest(configOrUrl, config)
    }

    dispatchRequest(configOrUrl, config) {
        if (typeof configOrUrl === 'string') {
            config = config || {};
            config.url = configOrUrl;
        } else {
            config = configOrUrl || {};
        }

        config = mergeConfig(this._defaults, config);

        console.log(config)
        return new Promise((resolve, reject) => {

        })
    }
};

['get', 'delete', 'head', 'options'].forEach(methodName => {
    Axios.prototype[methodName] = function (url, config) {
        console.log(this._defaults, '_defaults')
        return this.request(mergeConfig(config || {}, { method: methodName, url }))
    }
});

['post', 'put', 'patch'].forEach(methodName => {
    Axios.prototype[methodName] = function (url, data, config) {
        return this.request(mergeConfig(config || {}, { method: methodName, url, data }))
    }
});


function createAxiosInstance(config) {
    const context = new Axios(config)
    const instance = Axios.prototype.request.bind(context)

    Object.getOwnPropertyNames(Axios.prototype).forEach(key => {
        instance[key] = Axios.prototype[key].bind(context)
    })
    // createInstance最终是希望拿到一个Function，这个Function指向Axios.prototype.request，
    // 这个Function还会有Axios.prototype上的每个方法作为静态方法，
    // 且这些方法的上下文(this)都是指向同一个对象。
    return instance
}

const InitConfig = {
    method: 'get',
    'content-type': 'application/json'
}
const axios = createAxiosInstance(InitConfig)

axios({ url: 'http://locahost:3000' })
axios('http://locahost:3000')
axios.get('http://locahost:3000')
axios.post('http://locahost:3000', { age: 22 })
axios.request('http://locahost:3000', { age: 22 })