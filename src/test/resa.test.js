import Immutable from 'immutable';
import { call } from 'redux-saga/effects';
import createResa from '../resa';

function myReducer(state = {}, _action) {
    return state;
}

const model = {
    namespace: 'model',
    reducer: 'model',
    effects: {
        * add(_app, action, { fulfilled, _reject }) {
            yield call(fulfilled, action.payload);
        },

        * minus(_app, action, { _fulfilled, reject }) {
            yield call(reject, action.payload);
        },
    },
};

const callSelfModel = {
    namespace: 'callSelfModel',
    reducer: 'callSelfModel',
    effects: {
        * add(_app, action, { _fulfilled, _reject }) {
            yield call(this.effects.minus, action.payload);
        },

        * minus(_app, action, { _fulfilled, reject }) {
            yield call(reject, action.payload);
        },
    },
};

describe('createResa', () => {
    test('createResa return success', () => {
        const app = createResa();
        expect(app).toEqual(expect.objectContaining({
            store: expect.anything(),
            runSaga: expect.anything(),
            model: expect.anything(),
            registerModel: expect.anything(),
        }));
    });

    test('createResa set initialState success', () => {
        const app = createResa({ initialState: { myReducer: 'a' }, reducers: { myReducer } });
        expect(app.store.getState()).toEqual({
            myReducer: 'a',
            resaReducer: {},
        });
    });
});

describe('registerModel', () => {
    test('register model success', () => {
        const app = createResa();
        app.registerModel(model);
        expect(app.model.model).toEqual(expect.objectContaining({
            namespace: 'model',
            reducer: 'model',
            effects: {
                add: expect.anything(),
                minus: expect.anything(),
            },
        }));
    });
});

describe('dispatch action success', () => {
    test('dispatch fulfilled success', () => {
        const app = createResa();
        app.registerModel(model);
        app.model.model.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('dispatch fulfilled success when immutable', () => {
        const app = createResa({ immutable: Immutable });
        app.registerModel(model);
        app.model.model.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                resaReducer: {},
                model: Immutable.Map({
                    loading: false,
                    a: 'a',
                }),
            }));
        });
    });

    test('dispatch reject success', () => {
        const app = createResa();
        app.registerModel(model);
        app.model.model.effects.minus({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('dispatch action in saga', () => {
        const app = createResa();
        app.registerModel(callSelfModel);
        app.model.callSelfModel.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                callSelfModel: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('model getState success', () => {
        const app = createResa();
        app.registerModel(callSelfModel);
        app.model.callSelfModel.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.model.callSelfModel.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                a: 'a',
                loading: false,
            });
        });
    });

    test('model getState success when use immutable', () => {
        const app = createResa({ immutable: Immutable });
        app.registerModel(callSelfModel);
        app.model.callSelfModel.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.model.callSelfModel.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                loading: false,
                a: 'a',
            }));
        });
    });
});

const model1 = {
    namespace: 'model1',
    reducer: 'model',
    effects: {
        * add(_app, action, { fulfilled, _reject }) {
            yield fulfilled(action.payload);
        },
    },
};

const model2 = {
    namespace: 'model2',
    reducer: 'model',
    effects: {
        * add(_app, action, { fulfilled, _reject }) {
            yield fulfilled(action.payload);
        },
    },
};

describe('tow model use same reducer', () => {
    test('reserve state after add new model in same reducer', () => {
        const app = createResa();
        app.registerModel(model1);
        app.model.model1.effects.add({ a: 'a' });
        app.registerModel(model2);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('tow model use same reducer', () => {
        const app = createResa();
        app.registerModel(model1);
        app.registerModel(model2);
        app.model.model1.effects.add({ a: 'a' });
        app.model.model2.effects.add({ b: 'b' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    b: 'b',
                    loading: false,
                },
            });
        });
    });
});
