class People {

    constructor(name) {
        this.p = Promise.resolve(name)

    }

    sleep(time) {
        this.p = this.p.then(name => {
            return new Promise((resolve, reject) => {
                setTimeout(() => [
                    resolve(name)
                ], time)
            })
        })

        return this
    }

    eat(food) {
        // console.log(`${this.name} eat ${food}`)
        this.p = this.p.then(name => {
            console.log(`${name} eat ${food}`)
            return Promise.resolve(name)
        })

        return this
    }
}

new People('whr').sleep(1000).eat('apple').sleep(5000).eat('durian');