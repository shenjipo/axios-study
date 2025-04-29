let myresolve = null

const mypromise = new Promise((resolve, reject) => {
    myresolve = resolve
})



mypromise.then(res => {
    console.log('res')
})

mypromise.then = (fullfilled) => {
    console.log('fullfilled')
}

myresolve()
mypromise.then()