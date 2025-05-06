## 源码

[demo源码](https://github.com/shenjipo/axios-study)

[axios源码](https://github.com/axios/axios)

## 介绍

`axios`是一个基于`promise`的能够在`node环境和浏览器环境`下使用的`http`请求库，本文通过研究源码来解释使用过程中的一些问题

### 如何使用axios？为什么axios有多种使用方式，如何实现的？

[demo案例](https://github.com/shenjipo/axios-study/blob/master/01.axios%E5%B7%A5%E5%8E%82%E6%96%B9%E6%B3%95%E5%88%9B%E5%BB%BA%E5%AE%9E%E4%BE%8B.js)

axios提供了以下5种调用方式，实现思路如下

```javascript
axios({url, method, headers})
axios(url, {method, headers})
axios.get(url, {headers})
axios.post(url, data, {headers})
axios.request({url, method, headers})
```

createInstance最终是希望拿到一个Function，这个Function指向Axios.prototype.request，这个Function还会有Axios.prototype上的每个方法作为静态方法，且这些方法的上下文(this)都是指向同一个对象。下面是简化的代码

```
function createAxiosInstance(config) {
    const context = new Axios(config)
    const instance = Axios.prototype.request.bind(context)

    Object.getOwnPropertyNames(Axios.prototype).forEach(key => {
        instance[key] = Axios.prototype[key].bind(context)
    })
    return instance
}
```


### 为什么axios既能在浏览器环境下使用，也能在node环境下使用?

[浏览器环境demo](https://github.com/shenjipo/axios-study/blob/master/02.axios%E9%80%82%E9%85%8Dnode%E5%92%8C%E6%B5%8F%E8%A7%88%E5%99%A8%E7%8E%AF%E5%A2%83.html)

[node环境demo](https://github.com/shenjipo/axios-study/blob/master/02.axios%E9%80%82%E9%85%8Dnode%E5%92%8C%E6%B5%8F%E8%A7%88%E5%99%A8%E7%8E%AF%E5%A2%83.js)

1. 打包的时候针对不同环境打不同的包，在`rollup.config.js`文件种可以看到打包的配置，打包成`commonJs`格式给node环境，打包成`ESM`格式给浏览器环境，此外还打包了一个`UMD`格式兼容两种环境（给没有使用包管理工具的项目使用）。然后配置`package.json`文件的`exports`字段，告诉当使用模块化导入时应该使用哪种打包方式的`axios`文件。
2. 适配器模式，axios内置了3种`http请求适配器`，`xhr` `http` `fetch`，如果没有手动指定或者自定义`http请求适配器`，那么浏览器环境下默认使用`xhr`，node环境下默认使用`node`

```
// 在node环境下运行，会自动选择 httpAdapter
const isHttpAdapterSupported = typeof process !== 'undefined' && Object.prototype.toString.call(process).slice(8, -1)
const httpAdapter = isHttpAdapterSupported && function httpAdapter() {
    console.log('httpAdapter')
}

// 浏览器环境下，默认使用xhr
const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';
const xhrAdapter = isXHRAdapterSupported && function (config) {
    console.log('xhrAdapter')
}

// 浏览器环境下 下面三个同时为true 使用最新的fetch api
const isFetchSupported = typeof fetch === 'function' && typeof Request === 'function' && typeof Response === 'function';
const fetchAdapter = isFetchSupported && function (config) {
    console.log('fetchAdapter')
}

function getAdapter(adapters) {
    adapters = Array.isArray(adapters) ? adapters : [adapters];
    let adapter = null;
    for (let i = 0; i < adapters.length; i++) {
        nameOrAdapter = adapters[i];
        adapter = nameOrAdapter;
        // 如果 adapter为null和false，表明在当前环境下此默认适配器不可使用
        // 如果adapter为function，表明用户自定义了适配器
        if (adapter !== null && adapter !== false && typeof adapter !== 'function') {
            adapter = knownAdapters[String(nameOrAdapter).toLowerCase()];
        }

        if (adapter) {
            break;
        }
    }
    return adapter
}
```

### axios的拦截器是啥？自定义的多个请求/响应拦截器执行顺序？

[基于promise链式调用demo](https://github.com/shenjipo/axios-study/blob/master/02.promise%E9%93%BE%E5%BC%8F%E8%B0%83%E7%94%A8.js)

[拦截器demo](https://github.com/shenjipo/axios-study/blob/master/03.axios%E6%8B%A6%E6%88%AA%E5%99%A8%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86.js)

`promise.then`方法执行成功之后仍然会返回一个`promise`对象，基于此，可以实现`promise`的链式调用，想一想如何实现下面的例子

```
// (等待1s) -> 输出 whr eat apple -> (等待5s) -> 输出 whr eat durian
new People('whr').sleep(1000).eat('apple').sleep(5000).eat('durian');
```

`Interceptors`的核心就是一个`fullfilled 状态的promise`，把`axios`的`config`作为参数生成第一个`fullfilled的promise`，然后初始化一个数组`chains`，其第一个元素是某个适配器的`dispatchRequest`方法，第二个参数是null，接着把请求拦截器通过`unshiftf`方法塞到数组前面，把相应拦截器通过`push`方法塞到数组后面，最后依次从数组最前面取出两个元素(对应了我们自定义拦截器时写的两个函数，一个成功的回调函数，一个失败的回调)，分别作为`promise.then`方法的第一个和第二个参数

```
request(config) {
    const chains = [this.dispatchRequest, null]
    let promise = Promise.resolve(this.config);


    this.interceptors.request.handlers.forEach((interceptor) => {
        chains.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    this.interceptors.response.handlers.forEach((interceptor) => {
        chains.push(interceptor.fulfilled, interceptor.rejected);
    });

    while (chains.length) {
        promise = promise.then(chains.shift(), chains.shift())
    }

    return promise
}
```

### axios如何基于promise搭建基于xhr的异步桥梁？

[demo案例](https://github.com/shenjipo/axios-study/blob/master/04.axios%E6%98%AF%E5%A6%82%E4%BD%95%E7%94%A8promise%E6%90%AD%E8%B5%B7%E5%9F%BA%E4%BA%8Exhr%E7%9A%84%E5%BC%82%E6%AD%A5%E6%A1%A5%E6%A2%81.html)

初始化一个`promise`实例，在xhr的`onloadend`回调函数中执行`resolve`方法，其它异常回调函数中执行`reject`方法

```
const xhrAdapter = isXHRAdapterSupported && function (config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {

        let request = new XMLHttpRequest();
        request.open(config.method, config.url, true);

        request.onloadend = function onloadend() {
            const response = {
                data: request.responseText,
                status: request.status,
                statusText: request.statusText,
            }
            resolve(response)
        };

        request.onerror = function handleError() {
            reject('xhr onerror!');
            request = null;
        };

        request.ontimeout = function handleTimeout() {
            reject('xhr ontimeout');
            request = null;
        };

        request.send({})
    })
}
```


### axios如何实现取消请求

取消axios请求有两种方法，这里暂且只讲第一种

[demo案例](https://github.com/shenjipo/axios-study/blob/master/06.axios%E5%AE%9E%E7%8E%B0%E5%8F%96%E6%B6%88%E8%AF%B7%E6%B1%82.html)

如何在`axios`中取消请求，下面是个例子，在调用post请求时，传入一个`axios.CancelToken`实例对象，这个对象接收一个函数作为参数，我们在函数内部能够拿到一个`cancel`对象，这也是一个函数，执行`cancel`函数相当于在`cancelToken`内部的`promise`内部执行`resolve`方法，最后在执行`xhr.send`方法之前，判断`cancelToken.promise`的状态，如果是`fullfilled`状态，那么就代表取消请求

```

axios.post('http://localhost:3000', {}, {
    cancelToken: new axios.CancelToken(cancel => {
        stopRequest = cancel;
    })
}).then(res => {

}).catch(err => {
    console.log(err)
})
```


### 为什么`/dist/axios.js`文件中的`httpAdapter`为null？

在 Rollup 打包成 UMD 格式时，`process` 对象默认是不存在的。

### 源码中的一些技巧

区分好`Object.protorype.toString.call(process)`和`Object.protorype.toString(process)`

Object.protorype.toString(process)这种写法是错误的，不存在这种用法，始终返回`[object, object]`，

使用`Object.protorype.toString.call(process)`而不是`process.toString()`是为了防止`process`上的`toString`方法被改写
