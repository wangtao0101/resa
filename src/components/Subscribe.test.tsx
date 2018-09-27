import * as React from 'react';
import { init, Model, effect, reducer } from '../decorators';
import createResa from '../resa';
import * as TestUtils from 'react-dom/test-utils';
import Subscribe, { ThemeSubscribe } from './Subscribe';
import Provider from './Provider';

interface MyModelState {
    count: number;
    length: number;
}

@init<MyModelState>({
    name: 'model',
    state: {
        count: 0,
        length: 5,
    },
})
class MyModel extends Model<MyModelState> {
    @effect()
    *add() {
        this.fulfilled({
            count: 1,
        });
    }

    @effect()
    *ss() {
        this.fulfilled({
            length: 1,
        });
    }
}

@init<MyModelState>({
    name: 'sencondModel',
    state: {
        count: 1,
        length: 5,
    },
})
class SecondModel extends Model<MyModelState> {
    @effect()
    *add() {
        this.fulfilled({
            count: 1,
        });
    }
}

describe('Subscribe', () => {
    it('calculateShouldUpdate should return true only when update used states', async () => {
        const app = createResa();
        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <Subscribe to={[new MyModel()]}>{(myModel: MyModel) => <div>{myModel.state.count}</div>}</Subscribe>
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, ThemeSubscribe);
        container.render = jest.fn();
        app.models.model.add();
        app.models.model.ss();
        expect(container.render).toBeCalledTimes(1);
    });

    it('new resa model', async () => {
        const app = createResa();
        TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <Subscribe to={[MyModel]}>{(myModel: MyModel) => <div>{myModel.state.count}</div>}</Subscribe>
            </Provider>,
        );
        app.models.model.add();
    });

    it.only('should not notify nested sub', async () => {
        const app = createResa();
        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <Subscribe to={[MyModel]}>
                    {(myModel: MyModel) => (
                        <div>
                            {myModel.state.count}
                            <Subscribe to={[SecondModel, MyModel]}>
                                {(secondModel: SecondModel) => (
                                    <div>
                                        {secondModel.state.count}
                                    </div>
                                )}
                            </Subscribe>
                        </div>
                    )}
                </Subscribe>
            </Provider>,
        );
        // const container = TestUtils.scryRenderedComponentsWithType(tree, ThemeSubscribe)[1];
        // container.render = jest.fn();
        app.models.model.add();
        /* TODO: render should be called 1 */
        // expect(container.render).toBeCalledTimes(0);
    });
});
