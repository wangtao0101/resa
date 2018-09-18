import * as Immutable from 'immutable';
import createResa, { combineModel } from 'resa';

const model1 = {
    name: 'model1',
    state: {
        count: 0,
    },
    effects: {
        * add(count) {
            // @ts-ignore
            this.fulfilled({
                // @ts-ignore
                count: this.state.count + count,
            });
            yield 0;
        },
    },
};

const model2 = {
    name: 'model2',
    state: {
        count: 0,
    },
    effects: {
        * add(count) {
            // @ts-ignore
            this.fulfilled({
                // @ts-ignore
                count: this.state.count + count + count,
            });
            yield 0;
        },
    },
};

// @ts-ignore
const combinedModel = combineModel('xxx', [model1, model2]);

describe('combineModel', () => {
    test('combinemodel resiger success', () => {
        const app: any = createResa();
        app.registerModel(combinedModel);
        expect(app.store.getState()).toEqual({
            xxx: {
                model1: { count: 0 },
                model2: { count: 0 },
            },
            resaReducer: {},
        });
    });

    test('combinemodel dispatch action success', () => {
        const app: any = createResa();
        app.registerModel(combinedModel);
        app.models.model1.add(1);
        app.models.model2.add(2);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                xxx: {
                    model1: { count: 1 },
                    model2: { count: 4 },
                },
            });
        });
    });

    test('immutable root', () => {
        const app: any = createResa({ initialState: Immutable.Map() });
        app.registerModel(combinedModel);
        app.models.model1.add(1);
        app.models.model2.add(2);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                resaReducer: {},
                xxx: {
                    model1: { count: 1 },
                    model2: { count: 4 },
                },
            }));
        });
    });

    test('avoid resigter top level combined model twice', () => {
        expect(() => {
            const app = createResa();
            app.registerModel(combinedModel);
            app.registerModel(combinedModel);
        }).toThrow(/name of model should be unique, please check model name:/);
    });

    test('unRegisterModel combined model success', () => {
        const app = createResa();
        app.registerModel(combinedModel);
        app.unRegisterModel(combinedModel);
        expect(app.models).toEqual({});
    });

    test('should only unRegister root model', () => {
        expect(() => {
            const app = createResa();
            app.registerModel(combinedModel);
            app.unRegisterModel(model1);
        }).toThrow(/should only unRegister root model/);
    });
});
