class Interceptors {
    constructor() {
        this.handlers = []
    }

    use(fulfilled, rejected) {
        this.handlers.push({
            fulfilled: fulfilled,
            rejected: rejected
        })
    }
}

class Axios {
    constructor(config) {
        this.config = config
        this.interceptors = {
            request: new Interceptors(),
            response: new Interceptors()
        }
    }

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

    dispatchRequest(config) {
        console.log('开始发送请求，预计用时2s')
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const res = {
                    code: 1,
                    msg: '请求成功',
                    data: {
                        age: 22
                    }
                }
                console.log('收到响应')
                resolve({ data: res, config })
            }, 2000)
        })
    }
}

const axios = new Axios({ url: 'https://www.baidu.com' })

axios.interceptors.request.use((config) => {
    console.log('请求拦截1,用时1s', config)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject('路径异常')
        }, 1000)
    })
}, () => {
    console.log('请求拦截1失败')
    return Promise.reject()
})

axios.interceptors.request.use((config) => {
    console.log('请求拦截2,用时2s', config)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(config)
        }, 2000)
    })
}, () => {
    console.log('请求拦截2失败')
    return Promise.reject()
})

axios.interceptors.response.use((data) => {
    console.log('响应拦截1,用时1s', data)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(data)
        }, 2000)
    })
}, (err) => {
    console.log('响应拦截1失败')
    return Promise.reject(err)
})

axios.interceptors.response.use((config) => {
    console.log('响应拦截2')
    return config
}, (err) => {
    console.log('响应拦截2失败')
    return Promise.reject(err)
})

axios.request().then(res => {

}).catch(err => {
    console.log('err=', err)
})