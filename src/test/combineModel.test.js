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
            this.fulfilled({
                count: this.state.count + count + count,
            });
            yield 0;
        },
    },
};

const combinedModel = combineModel('xxx', [model1, model2]);

describe('combineModel', () => {
    test('combinemodel resiger success', () => {
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

    test('combinemodel dispatch action success', () => {
        const app = createResa();
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
});
