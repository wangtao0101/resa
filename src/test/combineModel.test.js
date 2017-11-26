import createResa from './..';
import combineModel from '../combineModel';

const model1 = {
    name: 'model1',
    state: {
        count: 0,
    },
    effects: {
        * add(count) {
            this.fulfilled({
                count: this.count + count,
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
            this.fulfilled({
                count: this.count + count + count,
            });
            yield 0;
        },
    },
};

const combinedModel = combineModel('xxx', [model1, model2]);

describe('combineModel', () => {
    test.only('combinemodel resiger success', () => {
        const app = createResa();
        app.registerModel(combinedModel);
        expect(app.store.getState()).toEqual({
            xxx: {
                model1: { count: 0 },
                model2: { count: 0 },
            },
            resaReducer: {},
        });
    });

    test.only('combinemodel dispatch action success', () => {
        const app = createResa();
        app.registerModel(combinedModel);
    });
});
