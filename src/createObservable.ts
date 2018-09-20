// const createObservableProperty = function createObservableProperty(target, property) {
//     Object.defineProperty(target, property, {
//         get: function get() {
//             return target[property];
//         },
//     });
// };

// const createObservable = function createObservable(target) {
//     for(let i in target) {
//         if(target.hasOwnProperty(i)) {
//             createObservableProperty(target, i);
//         }
//     }
// };

const createObservable = function createObservable(target, depandenceMap) {
    const handler = {
        get(target, key, proxy) {
            console.log(`GET request for ${key}`);
            depandenceMap[key] = true;
            return Reflect.get(target, key, proxy);
        },
    };
    return new Proxy(target, handler);
}

export default createObservable;
