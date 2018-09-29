import * as invariant from 'invariant';

export default function (pure: boolean = false) {
    return (target, key: string, descriptor: PropertyDescriptor) => {
        invariant(
            Object.prototype.toString.call(descriptor.value) === "[object Function]",
            'function decorator by reducer should be function'
        );
        if (pure) {
            if (!target.__pureReducers__) {
                Object.defineProperty(target, '__pureReducers__', {
                    value: {},
                    enumerable: false,
                    writable: false,
                    configurable: false,
                })
            }
            target.__pureReducers__[key] = descriptor.value;
            return descriptor;
        }
        if (!target.__reducers__) {
            Object.defineProperty(target, '__reducers__', {
                value: {},
                enumerable: false,
                writable: false,
                configurable: false,
            })
        }
        target.__reducers__[key] = descriptor.value;
        return descriptor;
    };
}