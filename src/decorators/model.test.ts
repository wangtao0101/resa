import { Model, effect, reducer, init, wapper } from 'resa';
import { delay } from 'redux-saga';
import { call } from 'redux-saga/effects';
import createResa from 'resa';

describe('Model test', () => {
    test('default Model', () => {
        @init({ state: 0})
        class A extends Model{
            @effect()
            * add() {
                yield 0;
            }

            @reducer()
            minus(payload) {
                return payload - 1;
            }
        }
        const B = new A();
        expect(B['name']).toEqual('A');
        expect(Object.prototype.toString.call(B['effects'].add[0])).toEqual('[object Function]')
        expect(B['effects'].add[1]).toEqual('takeEvery');
        expect(B['reducers'].minus(1)).toEqual(0);
    });
});

interface MyModelState {
    count: number;
}

@init<MyModelState>({
    name: 'model',
    state : {
        count: 0,
    }
})
class MyModel extends Model<MyModelState>{
    @effect()
    * delayAdd(payload) {
        this.fulfilled(payload);
        yield delay(10);
        this.add();
        return 5;
    }

    @effect('takeLatest')
    * count(payload) {
        yield delay(10);
        this.fulfilled({
            count: this.state.count + 1,
        });
    }

    @effect()
    * mul(a, b) {
        this.fulfilled({ count: a * b });
    }

    @effect()
    * testGe(a, b) {
        this.fulfilled({
            count: 0,
        })
    }

    @reducer()
    add() {
        return {
            count: this.state.count + 1,
        }
    }

    @reducer()
    ful(payload: Object): MyModelState {
        return this.fulfilled(payload);
    }

    @reducer(true)
    ['pure'](state, action) {
        return Object.assign({}, state, {count : state.count + action.payload});
    }
}

describe('Model test use resa', () => {
    test('register model success', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        expect(app.models.model).toEqual(expect.objectContaining({
            name: 'model',
            delayAdd: expect.anything(),
            add: expect.anything(),
        }));
    });

    test('dispatch fulfilled success', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        app.models.model.delayAdd({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    count: 0,
                },
            });
        });
    });

    test('dispatch return promise resolve success', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        const model: MyModel = app.models.model;
        return wapper(model.delayAdd({ a: 'a' }))
            .then((data) => {
                expect(data).toEqual(5);
            });
    });

    test('takeLatest', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        app.models.model.count();
        app.models.model.count();
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.model.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 1,
            });
        });
    });

    test('multiple args', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        app.models.model.mul(2, 4);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.model.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 8,
            });
        });
    });

    test('test fullfilled in reducer', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        const model: MyModel = app.models.model;
        model.ful({ a: 'a'});
        model.ful({ b: 'b'});
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(model.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 0,
                a: 'a',
                b: 'b',
            });
        });
    });

    test('pure reducer', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        app.store.dispatch({
            type: 'pure',
            payload: 9,
        });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.model.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                count: 9,
            });
        });
    });
});

type NumState = number;

@init({
    name: 'model',
    state : 0
})
class OtherModel extends Model<NumState> {
    @effect()
    * add(count) {
        this.fulfilled(this.state + count);
    }
}

describe('non object state', () => {
    test('non object state', () => {
        const B = new OtherModel();
        const app = createResa();
        app.registerModel(B);
        app.models.model.add(3);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.model.state);
            }, 20);
        }).then((data) => {
            expect(data).toEqual(3);
        });
    });
});

@init({
    name: 'xxModel',
    state : 0
})
class xxModel extends Model<NumState>{

    // @ts-ignore
    models: {
        model: OtherModel,
    }

    @effect()
    * add(count: number) {
        this.models.model.add(count + 5);
    }
}

describe('inject othermodel in model', () => {
    test('run success', () => {
        const other = new OtherModel();
        const xx = new xxModel();
        const app = createResa();
        app.registerModel(other);
        app.registerModel(xx);
        app.models.xxModel.add(3);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.model.state);
            }, 100);
        }).then((data) => {
            expect(data).toEqual(8);
        });
    });
});
