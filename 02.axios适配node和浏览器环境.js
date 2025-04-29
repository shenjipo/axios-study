// 在Node.js中使用http模块发送HTTP请求时，本身对Node.js版本没有特别限制，
// 但若想使用fetch API这种更简洁的HTTP请求方式，
// 使用fetch API对版本有要求
// 版本要求：从Node.js 17.5版本开始，实验性地引入了对fetch API的支持，无需借助第三方库即可实现跨平台兼容的HTTP请求。
// 启用方式：在Node.js 17.5及以上版本中，可通过node --experimental-fetch命令行标志启用该特性。
// 后续发展：在Node.js 18版本中，fetch API已从实验特性升级为稳定特性，开发者可直接使用，无需额外标志


// 在这个(node)环境下运行，会自动选择 httpAdapter
const isHttpAdapterSupported = typeof process !== 'undefined' && Object.prototype.toString.call(process).slice(8, -1)
const httpAdapter = isHttpAdapterSupported && function httpAdapter() {
    console.log('httpAdapter')
}

// 浏览器环境下，默认还是使用xhr
const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';
const xhrAdapter = isXHRAdapterSupported && function (config) {
    console.log('xhrAdapter')
}

// 浏览器环境下 下面三个同时为true 使用最新的fetch api
const isFetchSupported = typeof fetch === 'function' && typeof Request === 'function' && typeof Response === 'function';
const fetchAdapter = isFetchSupported && function (config) {
    console.log('fetchAdapter')
}


const knownAdapters = {
    http: httpAdapter,
    xhr: xhrAdapter,
    fetch: fetchAdapter
}

function getAdapter(adapters) {
    adapters = Array.isArray(adapters) ? adapters : [adapters];

    const { length } = adapters;
    let adapter = null;
    for (let i = 0; i < length; i++) {
        nameOrAdapter = adapters[i];

        adapter = nameOrAdapter;

        if (adapter !== null && adapter !== false && typeof adapter !== 'function') {
            adapter = knownAdapters[String(nameOrAdapter).toLowerCase()];

            if (adapter === undefined) {
                throw new AxiosError(`Unknown adapter '${id}'`);
            }
        }

        if (adapter) {
            break;
        }
    }
    return adapter
}

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

        const adapter = getAdapter(config.adapter)
        return adapter(config)
    }
};

['get', 'delete', 'head', 'options'].forEach(methodName => {
    Axios.prototype[methodName] = function (url, config) {

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

    // Object.getOwnPropertyNames(Axios.prototype) 与 Obeject.keys区别
    Object.getOwnPropertyNames(Axios.prototype).forEach(key => {

        instance[key] = Axios.prototype[key].bind(context)
    })

    return instance
}

const InitConfig = {
    method: 'get',
    'content-type': 'application/json',
    adapter: ['xhr', 'http', 'fetch']
}
const axios = createAxiosInstance(InitConfig)
axios.get('http://locahost:3000')
