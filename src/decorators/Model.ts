import * as clone from 'clone';

export default class Model<S = any> {

    // @ts-ignore
    state: S;
    // @ts-ignore
    fulfilled(payload?: S | Partial<S>): S;
    // @ts-ignore
    name: string;

    constructor() {
        this['effects'] = this['__effects__'];
        this['reducers'] = this['__reducers__'];
        this['pureReducers'] = this['__pureReducers__'];
        Object.defineProperty(this, 'name', {
            value: this.constructor['__name__'],
            enumerable: true,
            writable: false,
            configurable: false,
        })
        Object.defineProperty(this, 'state', {
            value: clone(this.constructor['__state__']),
            enumerable: true,
            writable: false,
            configurable: false,
        })
    }
}
