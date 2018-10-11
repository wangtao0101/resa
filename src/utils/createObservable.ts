const createObservableProperty = function createObservableProperty(target, property, value, depandenceMap) {
    Object.defineProperty(target, property, {
        get: function get() {
            depandenceMap[property] = true;
            return value;
        },
    });
};

const createObservable = function createObservable(target, depandenceMap) {
    const newTarget = {}
    for(let key in target) {
        if(target.hasOwnProperty(key)) {
            createObservableProperty(newTarget, key, target[key], depandenceMap);
        }
    }
    return newTarget;
};

export default createObservable;
