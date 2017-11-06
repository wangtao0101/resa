import Immutable from 'immutable';
import { delay } from 'redux-saga';
import { call } from 'redux-saga/effects';
import createResa from '../resa';


function myReducer(state = {}, _action) {
    return state;
}

const model = {
    name: 'model',
    effects: {
        * add(payload) {
            yield call(this.fulfilled, payload);
            return 5;
        },

        * minus(payload) {
            yield call(this.reject, payload);
            throw new Error('error');
        },
    },
};

const effectModel = {
    name: 'effectModel',
    state: {
        count: 0,
    },
    effects: {
        add: [function* (payload, { effectModel }) { // eslint-disable-line
            yield delay(10);
            yield call(this.fulfilled, { count: effectModel.getState().count + 1 });
        }, 'takeLatest'],
    },
};

const callSelfModel = {
    name: 'callSelfModel',
    effects: {
        * add(payload) {
            yield call(this.minus, payload);
        },

        * minus(payload) {
            yield call(this.reject, payload);
        },
    },
};

const modelState = {
    name: 'modelState',
    state: 0,
    effects: {
        * add(payload) {
            yield call(this.minus, payload);
        },
    },
    reducers: {
        minus(state, { payload }) {
            return state + payload;
        },
    },
};

describe('createResa', () => {
    test('createResa return success', () => {
        const app = createResa();
        expect(app).toEqual(expect.objectContaining({
            store: expect.anything(),
            runSaga: expect.anything(),
            models: expect.anything(),
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
    test('register model success use default reducerName', () => {
        const app = createResa();
        app.registerModel(model);
        expect(app.models.model).toEqual(expect.objectContaining({
            name: 'model',
            reducerName: 'model',
            add: expect.anything(),
            minus: expect.anything(),
        }));
    });

    test('register model success use reducerName in model', () => {
        const app = createResa();
        app.registerModel(Object.assign({}, model, { reducerName: 'model1' }));
        expect(app.models.model).toEqual(expect.objectContaining({
            name: 'model',
            reducerName: 'model1',
            add: expect.anything(),
            minus: expect.anything(),
        }));
    });
});

describe('dispatch action success', () => {
    test('dispatch fulfilled success', () => {
        const app = createResa();
        app.registerModel(model, 'model');
        app.models.model.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                },
            });
        });
    });

    test('dispatch return promise resolve success', () => {
        const app = createResa();
        app.registerModel(model, 'model');
        return app.models.model.add({ a: 'a' })
            .then((data) => {
                expect(data).toEqual(5);
            });
    });

    test('dispatch return promise reject success', () => {
        const app = createResa();
        app.registerModel(model, 'model');
        return app.models.model.minus({ a: 'a' })
            .catch((data) => {
                expect(data.message).toEqual('error');
            });
    });

    test('dispatch fulfilled success when immutable', () => {
        const app = createResa({ immutable: Immutable });
        app.registerModel(model, 'model');
        app.models.model.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                resaReducer: {},
                model: Immutable.Map({
                    a: 'a',
                }),
            }));
        });
    });

    test('dispatch reject success', () => {
        const app = createResa();
        app.registerModel(model, 'model');
        app.models.model.minus({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                },
            });
        });
    });

    test('dispatch action in saga', () => {
        const app = createResa();
        app.registerModel(callSelfModel, 'callSelfModel');
        app.models.callSelfModel.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                callSelfModel: {
                    a: 'a',
                },
            });
        });
    });

    test('model getState success', () => {
        const app = createResa();
        app.registerModel(callSelfModel, 'callSelfModel');
        app.models.callSelfModel.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.callSelfModel.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                a: 'a',
            });
        });
    });

    test('model getState success when use immutable', () => {
        const app = createResa({ immutable: Immutable });
        app.registerModel(callSelfModel, 'callSelfModel');
        app.models.callSelfModel.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.callSelfModel.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                a: 'a',
            }));
        });
    });

    test('takeLatest', () => {
        const app = createResa();
        app.registerModel(effectModel, 'effectModel');
        app.models.effectModel.add({ a: 'a' });
        app.models.effectModel.add({ a: 'c' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.effectModel.getState());
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 1,
            });
        });
    });

    test('non object state', () => {
        const app = createResa();
        app.registerModel(modelState, 'modelState');
        app.models.modelState.add(10);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 10);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                modelState: 10,
            });
        });
    });
});

const model1 = {
    name: 'model1',
    effects: {
        * add(payload) {
            yield this.fulfilled(payload);
        },
    },
};

const model2 = {
    name: 'model2',
    effects: {
        * add(payload) {
            yield this.fulfilled(payload);
        },
    },
};

describe('two model use same reducer', () => {
    test('reserve state after add new model in same reducer', () => {
        const app = createResa();
        app.registerModel(model1, 'model');
        app.models.model1.add({ a: 'a' });
        app.registerModel(model2, 'model');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                },
            });
        });
    });

    test('tow model use same reducer', () => {
        const app = createResa();
        app.registerModel(model1, 'model');
        app.registerModel(model2, 'model');
        app.models.model1.add({ a: 'a' });
        app.models.model2.add({ b: 'b' });
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
                },
            });
        });
    });
});

const modelReducer = {
    name: 'modelReducer',
    effects: {
        * add(payload) {
            yield this.fulfilled(payload);
        },
    },
    reducers: {
        xxx(state, { payload }) {
            return Object.assign(state, payload);
        },
    },
};

describe('reducers', () => {
    test('handle reducers success', () => {
        const app = createResa();
        app.registerModel(modelReducer, 'modelReducer');
        app.models.modelReducer.xxx({ a: 'dd' });
        expect(app.store.getState()).toEqual({
            resaReducer: {},
            modelReducer: {
                a: 'dd',
            },
        });
    });
});

const unModel = {
    name: 'unModel',
    effects: {
        * add(payload) {
            yield delay(5);
            yield this.fulfilled(payload);
        },
    },
    reducers: {
        xxx(state, { payload }) {
            return Object.assign(state, payload);
        },
    },
};

const unModel1 = {
    name: 'unModel1',
    reducerName: 'unModel',
    effects: {
        * add(payload) {
            yield delay(5);
            yield this.fulfilled(payload);
        },
    },
    reducers: {
        xxx(state, { payload }) {
            return Object.assign(state, payload);
        },
    },
};

describe('unRegisterModel', () => {
    test('unRegisterModel model success', () => {
        const app = createResa();
        app.registerModel(unModel, 'unModel');
        app.models.unModel.xxx({ a: 'dd' });
        app.models.unModel.add({ b: 'cc' });
        app.unRegisterModel('unModel');
        expect(app.models).toEqual({});
        expect(app.store.asyncReducers).toEqual({});
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 10);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                unModel: {
                    a: 'dd',
                },
            });
        });
    });

    test('unRegisterModel model success when two models using same reducerName', () => {
        const app = createResa();
        app.registerModel(unModel, 'unModel');
        app.registerModel(unModel1, 'unModel');
        app.models.unModel.xxx({ a: 'dd' });
        app.models.unModel.add({ b: 'cc' });
        app.unRegisterModel('unModel');
        expect(app.models).toEqual(expect.objectContaining({
            unModel1: expect.anything(),
        }));
        expect(app.store.asyncReducers).toEqual(expect.objectContaining({
            unModel: expect.anything(),
        }));
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 10);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                unModel: {
                    a: 'dd',
                },
            });
        });
    });
});

const setupModel = {
    name: 'setupModel',
    effects: {
        * add(payload) {
            try {
                yield this.fulfilled(payload);
            } catch (error) {
                //
            }
        },
    },
    * setup() {
        yield call(this.add, { aa: 'bbc' });
        yield delay(10);
        yield call(this.add, { aa: 'bbb' });
    },
};

describe('test setup', () => {
    test('setup success', () => {
        const app = createResa();
        app.registerModel(setupModel, 'setupModel');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                setupModel: {
                    aa: 'bbc',
                },
            });
        });
    });

    test('cancel setup success', () => {
        const app = createResa();
        app.registerModel(setupModel, 'setupModel');
        return new Promise((resolve) => {
            setTimeout(() => {
                app.unRegisterModel('setupModel');
            }, 5);
            setTimeout(() => {
                resolve(app.store.getState());
            }, 15);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                setupModel: {
                    aa: 'bbc',
                },
            });
        });
    });
});
