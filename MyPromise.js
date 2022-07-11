class MyPromise {
    constructor(executor) {
        this.status = 'pending'; //用于保存promise状态
        this.value = undefined; //用于保存结果
        this.reason = undefined; //用于保存据因

        //链式执行
        this.resolvedQue = []; //用于保存then的成功执行 onFulfilled 回调数组
        this.rejectedQue = []; //用于保存then的拒绝执行 onRejected 回调数组

        if (typeof executor !== 'function') {
            throw new TypeError('Promise resolver undefined is not a function');
        }

        try {
            executor(this.resolve.bind(this), this.reject.bind(this));
        } catch (error) {
            this.reject(error);
        }

    }

    resolve(val) {
        if (this.status === 'pending') {
            this.status = 'fulfilled';
            this.value = val;
            this.resolvedQue.forEach(cb => {
                cb();
            })
        }
    }

    reject(reason) {
        if (this.status === 'pending') {
            this.status = 'rejected';
            this.reason = reason;
            console.log(this.reason);
            this.rejectedQue.forEach(cb => {
                cb();
            })
        }
    }

    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : reason => {
            throw reason;
        };
        let promise2 = new MyPromise((resolve, reject) => {
            if (this.status === 'fulfilled') {
                this.microFunc(() => {
                    try {
                        //console.log('fulfilled状态');
                        let x = onFulfilled(this.value);
                        this.resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                })
            }

            if (this.status === 'rejected') {
                this.microFunc(() => {
                    try {
                        let x = onRejected(this.reason);
                        this.resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                })
            }

            if (this.status === 'pending') {
                this.resolvedQue.push(() => {
                    this.microFunc(() => {
                        try {
                            let x = onFulfilled(this.value);
                            this.resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    })
                });

                this.rejectedQue.push(() => {
                    this.microFunc(() => {
                        try {
                            let x = onRejected(this.reason);
                            this.resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    })
                });
            }
        })

        return promise2;

    }

    resolvePromise(promise2, x, resolve, reject) {
        if (promise2 === x) {
            //return reject(new TypeError('Chaining cycle detected for promise'));
            return reject(new TypeError('禁止循环引用'));
        }

        if (x !== null && (typeof x === 'function' || typeof x === 'object')) {
            try {
                var then = x.then;
            } catch (error) {
                reject(error);
            }
            if (typeof then === 'function') {
                let used;
                try {
                    then.call(x, y => {
                        if (!used) {
                            used = true;
                            this.resolvePromise(promise2, y, resolve, reject);
                        } else {
                            return;
                        }
                    }, r => {
                        if (!used) {
                            used = true;
                            reject(r);
                        } else {
                            return;
                        }
                    })
                } catch (error) {
                    if (!used) {
                        used = true;
                        reject(error);
                    } else {
                        return;
                    }
                }
            } else {
                resolve(x);
            }
        } else {
            resolve(x);
        }
    }

    //实现promise的微任务
    microFunc(fn) {
        //优先用 MutationObserver
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(fn);
            let count = 1;
            const textNode = document.createTextNode(String(count));
            observer.observe(textNode, {
                characterData: true
            })
            textNode.data = String(++count);
        } else if (typeof process.nextTick !== 'undefined') {
            //node 环境下可以用 process.nextTick实现微任务
            process.nextTick(fn);
        } else {
            //宏任务,不推荐，都不支持前面方法再使用
            setTimeout(fn, 0);
        }
    }

}

// 执行测试用例需要用到的代码
MyPromise.defer = MyPromise.deferred = function () {
    let dfd = {}
    dfd.promise = new MyPromise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
}
module.exports = MyPromise;

var promise1 = new MyPromise((resolve, reject) => {
    resolve('hello');
})

var promise2 = promise1.then(() => {
    return promise2;
})