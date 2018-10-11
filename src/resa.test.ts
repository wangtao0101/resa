import * as Immutable from 'immutable';
import { delay } from 'redux-saga';
import { call } from 'redux-saga/effects';
import createResa from './resa';
import { init, Model, effect } from 'resa';

function myReducer(state = {}, _action) {
    return state;
}

const model = {
    name: 'model',
    state: {},
    effects: {
        * add(this: any, payload) {
            yield call(this.fulfilled, payload);
            return 5;
        },

        * minus(this: any, payload) {
            yield call(this.fulfilled, payload);
            throw new Error('error');
        },

        * div(this: any, a, b) {
            this.fulfilled({ result: a / b });
            yield 1;
        },

    },
    reducers: {
        mul(this: any, a, b) {
            return Object.assign({}, this.state, { result: a * b });
        },

        ful(this: any, payload) {
            return payload;
        },
    },
};

const immutableModel = {
    name: 'model',
    state: Immutable.Map(),
    effects: {
        * add(this: any, payload) {
            this.fulfilled(payload);
            yield 1;
            return 5;
        },

        * minus(this: any, payload) {
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
        add: [function* (this: any, payload) { // eslint-disable-line
            yield delay(10);
            this.fulfilled({ count: this.models.effectModel.state.count + 1 });
        }, 'takeLatest'],

        plus: [function* (this: any, count) { // eslint-disable-line
            yield delay(10);
            this.fulfilled({ count });
        }, 'takeFirst'],

        throttle: [function* (this: any, payload) { // eslint-disable-line
            yield delay(10);
            this.fulfilled({ count: this.models.effectModel.state.count + 1 });
        }, 'throttle', 100],

        * minus(this: any) {
            this.fulfilled({
                count: this.state.count + 1,
            });
            yield 0;
        },
    },
};

const callSelfModel = {
    name: 'callSelfModel',
    state: {},
    effects: {
        * add(payload) {
            yield call(this.minus, payload);
        },

        * minus(this: any, payload) {
            this.fulfilled(payload);
            yield 1;
        },
    },
};

const modelState = {
    name: 'modelState',
    state: 0,
    effects: {
        * add(this: any, payload) {
            yield call(this.minus, payload);
        },
    },
    reducers: {
        minus(this: any, payload) {
            return this.state + payload;
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
        const app: any = createResa({ initialState: { myReducer: 'a' }, reducers: { myReducer } });
        expect(app.store.getState()).toEqual({
            myReducer: 'a',
            resaReducer: {},
        });
    });
});

describe('registerModel', () => {
    test('register model success use default reducerName', () => {
        const app: any = createResa();
        app.registerModel(model);
        expect(app.models.model).toEqual(expect.objectContaining({
            name: 'model',
            add: expect.anything(),
            minus: expect.anything(),
        }));
    });
});

describe('dispatch action success', () => {
    test('dispatch fulfilled success', () => {
        const app: any = createResa();
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

    test('reducer use fulfilled success', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        app.models.model.ful({ a: 'aaa' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'aaa',
                },
            });
        });
    });

    test('avoid register twice', () => {
        expect(() => {
            const app = createResa();
            app.registerModel(effectModel);
            app.registerModel(effectModel);
        }).toThrow(/name of model should be unique, please check model name:/);
    });

    test('dispatch an empty payload success', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        app.models.model.add({ a: 'a' });
        app.models.model.add();
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

    test('should catch The payload must be an object if the shape of state is object', () => {
        const fn = jest.fn();
        const app: any = createResa({
            errorHandle: fn,
        });
        app.registerModel(model, 'model');
        app.models.model.add(1).catch(() => {});
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('dispatch return promise resolve success', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        return app.models.model.add({ a: 'a' })
            .then((data) => {
                expect(data).toEqual(5);
            });
    });

    test('dispatch return promise reject success', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        return app.models.model.minus({ a: 'a' })
            .catch((data) => {
                expect(data.message).toEqual('error');
            });
    });

    test('dispatch fulfilled success when immutable', () => {
        const app: any = createResa({ initialState: Immutable.Map() });
        app.registerModel(immutableModel, 'model');
        app.models.model.add({ a: { a: 'b' } });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                resaReducer: {},
                model: Immutable.Map({
                    a: {
                        a: 'b',
                    },
                }),
            }));
        });
    });

    test('dispatch fulfilled success dispatch immutable payload', () => {
        const app: any = createResa({ initialState: Immutable.Map() });
        app.registerModel(immutableModel, 'model');
        app.models.model.add(Immutable.Map({ a: { a: 'b' } }));
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                resaReducer: {},
                model: Immutable.Map({
                    a: {
                        a: 'b',
                    },
                }),
            }));
        });
    });

    test('dispatch reject success', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        app.models.model.minus({ a: 'a' }).catch(() => {});
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
        const app: any = createResa();
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
        const app: any = createResa();
        app.registerModel(callSelfModel, 'callSelfModel');
        app.models.callSelfModel.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.callSelfModel.state);
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                a: 'a',
            });
        });
    });

    test('model getState success when use immutable', () => {
        const app: any = createResa({ initialState: Immutable.Map() });
        app.registerModel(immutableModel, 'model');
        app.models.model.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.model.state);
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                a: 'a',
            }));
        });
    });

    test('takeFirst', () => {
        const app: any = createResa();
        app.registerModel(effectModel, 'effectModel');
        app.models.effectModel.plus(2);
        app.models.effectModel.plus(4);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.effectModel.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 2,
            });
        });
    });

    test('takeLatest', () => {
        const app: any = createResa();
        app.registerModel(effectModel, 'effectModel');
        app.models.effectModel.add({ a: 'a' });
        app.models.effectModel.add({ a: 'c' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.effectModel.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 1,
            });
        });
    });

    test('throttle', () => {
        const app: any = createResa();
        app.registerModel(effectModel, 'effectModel');
        app.models.effectModel.throttle({ a: 'a' });
        app.models.effectModel.throttle({ a: 'c' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.effectModel.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 1,
            });
        });
    });

    test('non object state', () => {
        const app: any = createResa();
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

    test('effect multiple args', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        app.models.model.div(4, 2);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 10);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    result: 2,
                },
            });
        });
    });

    test('reducer multiple args', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        app.models.model.mul(4, 2);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 10);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    result: 8,
                },
            });
        });
    });
});

const modelReducer = {
    name: 'modelReducer',
    state: {},
    effects: {
        * add(this: any, payload) {
            this.fulfilled(payload);
            yield 1;
        },
    },
    reducers: {
        xxx(this: any, payload) {
            return Object.assign(this.state, payload);
        },
    },
};

describe('reducers', () => {
    test('handle reducers success', () => {
        const app: any = createResa();
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
    state: {},
    effects: {
        * add(this: any, payload) {
            yield delay(5);
            this.fulfilled(payload);
        },
        * minus(this: any, payload) {
            yield this.fulfilled(payload);
        },
    },
    reducers: {
        xxx(this: any, payload) {
            return Object.assign(this.state, payload);
        },
    },
};

describe('unRegisterModel', () => {
    test('unRegisterModel model success', () => {
        const app: any = createResa();
        app.registerModel(unModel, 'unModel');
        app.models.unModel.xxx({ a: 'dd' });
        app.models.unModel.add({ b: 'cc' });
        app.unRegisterModel(unModel);
        expect(app.models).toEqual({});
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

    test('resigter twice success and dispatch action success after unRegisterModel model', () => {
        const app: any = createResa();
        app.registerModel(unModel, 'unModel');
        app.models.unModel.minus({ b: 'cc' });
        app.unRegisterModel(unModel);
        expect(app.models).toEqual({});
        app.registerModel(unModel, 'unModel');
        app.models.unModel.minus({ b: 'dd' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 10);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                unModel: {
                    b: 'dd',
                },
            });
        });
    });

    test('should not unRegister unRegistered model', () => {
        expect(() => {
            const app: any = createResa();
            app.registerModel(unModel, 'unModel');
            app.unRegisterModel(unModel);
            app.unRegisterModel(unModel);
        }).toThrow(/should not unRegister unRegistered model/);
    });

    test('name of model should be non empty string', () => {
        expect(() => {
            const app: any = createResa();
            app.registerModel(unModel, 'unModel');
            app.unRegisterModel({ name: 5 });
        }).toThrow(/name of model should be non empty string/);
    });
});

const emptyStateModel = {
    name: 'model',
};

describe('emptyStateModel', () => {
    test('emptyStateModel', () => {
        expect(() => {
            const app = createResa();
            app.registerModel(emptyStateModel);
        }).toThrow(/State in model should not be null or undefined./);
    });
});

const pureReducerModel = {
    name: 'model',
    state: 0,
    pureReducers: {
        add: (state, action) => state + action.payload,
    },
};

describe('pureReducerModel', () => {
    test('pureReducerModel', () => {
        const app: any = createResa();
        app.registerModel(pureReducerModel);
        app.store.dispatch({
            type: 'add',
            payload: 1,
        });
        expect(app.store.getState()).toEqual({
            resaReducer: {},
            model: 1,
        });
    });
});

interface MyModelState {
    count: number;
}

@init<MyModelState>({
    name: 'model',
    state: {
        count: 0,
    },
})
class MyModel extends Model<MyModelState> {
    @effect()
    *add(num: number) {
        this.fulfilled({
            count: this.state.count + num,
        });
    }
}

@init<MyModelState>({
    name: 'secondModel',
    state: {
        count: 0,
    },
})
class SecondModel extends Model<MyModelState> {
    @effect()
    *add(num: number) {
        this.fulfilled({
            count: this.state.count + num,
        });
    }
}

describe('new register', () => {
    test('register root model', () => {
        const app: any = createResa();
        app.register(new MyModel());
        app.models.model.add(2);
        expect(app.store.getState()).toEqual({
            resaReducer: {},
            model: {
                count: 2
            },
        });
    });

    test('register model in namespace', () => {
        const app: any = createResa();
        app.register(new MyModel(), 'namespace');
        app.models['namespace/model'].add(2);
        expect(app.store.getState()).toEqual({
            resaReducer: {},
            namespace: {
                model: {
                    count: 2
                },
            }
        });
    });

    test('register same model in different namespace', () => {
        const app: any = createResa();
        app.register(new MyModel(), 'namespace');
        app.register(new MyModel(), 'namespace1');
        app.models['namespace/model'].add(2);
        app.models['namespace1/model'].add(2);
        expect(app.store.getState()).toEqual({
            resaReducer: {},
            namespace: {
                model: {
                    count: 2
                },
            },
            namespace1: {
                model: {
                    count: 2
                },
            }
        });
    });

    test('register tow model in same namespace', () => {
        const app: any = createResa();
        app.register(new MyModel(), 'namespace');
        app.register(new SecondModel(), 'namespace');
        app.models['namespace/model'].add(2);
        app.models['namespace/secondModel'].add(2);
        expect(app.store.getState()).toEqual({
            resaReducer: {},
            namespace: {
                model: {
                    count: 2
                },
                secondModel: {
                    count: 2
                },
            },
        });
    });

    test('should throw namespace/name of model should be unique', () => {
        expect(() => {
            const app: any = createResa();
            app.register(new MyModel(), 'namespace');
            app.register(new MyModel(), 'namespace');
        }).toThrow(/namespace\/name of model should be unique/);
    });

    test('should throw name of model should be different of exist model name or exist namespace', () => {
        expect(() => {
            const app: any = createResa();
            app.register(new MyModel(), 'secondModel');
            app.register(new SecondModel());
        }).toThrow(/name of model should be different of exist model name or exist namespace/);
    });

    test('should throw namespace should be different of model name', () => {
        expect(() => {
            const app: any = createResa();
            app.register(new SecondModel());
            app.register(new MyModel(), 'secondModel');
        }).toThrow(/namespace should be different of model name/);
    });

    test('mix old registerModel and new register', () => {
        const app: any = createResa();
        app.registerModel(model, 'model');
        app.register(new MyModel(), 'namespace');
        app.models['namespace/model'].add(2);
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
                namespace: {
                    model: {
                        count: 2
                    },
                },
            });
        });
    });
});
