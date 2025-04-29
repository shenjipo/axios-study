// 输出 process
console.log(Object.prototype.toString.call(process).slice(8, -1))

// 浏览器环境下 下面三个同时为true
console.log(typeof fetch === 'function')
console.log(typeof Request === 'function')
console.log(typeof Response === 'function')
