import * as React from 'react';
import createResa, { Provider, init, Model, effect, useResa } from 'resa';
import * as rtl from 'react-testing-library';
import 'jest-dom/extend-expect';
import ResaContext from './Context';

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
            count: this.state.count + 1,
        });
    }

    @effect()
    *ss() {
        this.fulfilled({
            length: 1,
        });
    }
}

describe('useResa', () => {
    afterEach(rtl.cleanup);

    it('get state from resa', async () => {
        const app = createResa();

        const Child = () => {
            const [model] = useResa([MyModel]);
            return <div data-testid="id">{model.state.count}</div>;
        };

        const tester = rtl.render(
            <Provider resa={app}>
                <Child />
            </Provider>,
        );
        expect(tester.getByTestId('id')).toHaveTextContent('0');
    });

    it('model update data', async () => {
        const app = createResa();

        const Child = () => {
            const [model] = useResa([MyModel]);
            return <div data-testid="id">{model.state.count}</div>;
        };

        const tester = rtl.render(
            <Provider resa={app}>
                <Child />
            </Provider>,
        );
        expect(tester.getByTestId('id')).toHaveTextContent('0');

        rtl.act(() => {
            app.models.model.add();
        });
        expect(tester.getByTestId('id')).toHaveTextContent('1');
    });

    it('should not update if update unused state', async () => {
        const app = createResa();

        let renderTimes = 0;

        const Child = () => {
            const [model] = useResa([MyModel]);
            renderTimes += 1;
            return <div data-testid="id">{model.state.count}</div>;
        };

        const tester = rtl.render(
            <Provider resa={app}>
                <Child />
            </Provider>,
        );
        expect(tester.getByTestId('id')).toHaveTextContent('0');

        rtl.act(() => {
            app.models.model.ss();
        });
        expect(tester.getByTestId('id')).toHaveTextContent('0');
        expect(renderTimes).toBe(1);
    });

    it('should call render if state.length in dependence changed', async () => {
        const app = createResa();

        let renderTimes = 0;

        const Child = () => {
            const [model] = useResa([MyModel], ['length']);
            renderTimes += 1;
            return <div data-testid="id">{model.state.count}</div>;
        };

        const tester = rtl.render(
            <Provider resa={app}>
                <Child />
            </Provider>,
        );
        expect(tester.getByTestId('id')).toHaveTextContent('0');

        rtl.act(() => {
            app.models.model.ss();
        });
        expect(tester.getByTestId('id')).toHaveTextContent('0');
        expect(renderTimes).toBe(2);
    });
});

describe('lifeycle interactions', () => {
    afterEach(rtl.cleanup);

    it('subscribes to the store synchronously', async () => {
        const app = createResa();
        let rootSubscription;

        const Parent = () => {
            const { subscription } = React.useContext<any>(ResaContext);
            rootSubscription = subscription;

            const [model] = useResa([MyModel]);
            return model.state.count === 0 ? null : <Child />;
        };

        const Child = () => {
            const [model] = useResa([MyModel]);
            return <div data-testid="id">{model.state.count}</div>;
        };

        rtl.render(
            <Provider resa={app}>
                <Parent />
            </Provider>,
        );
        expect(rootSubscription.listeners.get().length).toBe(1);

        rtl.act(() => {
            app.models.model.add();
        });

        expect(rootSubscription.listeners.get().length).toBe(2);
    });

    it('unsubscribes when the component is unmounted', async () => {
        const app = createResa();
        let rootSubscription;

        const Parent = () => {
            const { subscription } = React.useContext<any>(ResaContext);
            rootSubscription = subscription;

            const [model] = useResa([MyModel]);
            return model.state.count === 1 ? null : <Child />;
        };

        const Child = () => {
            const [model] = useResa([MyModel]);
            return <div data-testid="id">{model.state.count}</div>;
        };

        rtl.render(
            <Provider resa={app}>
                <Parent />
            </Provider>,
        );
        expect(rootSubscription.listeners.get().length).toBe(2);

        rtl.act(() => {
            app.models.model.add();
        });

        expect(rootSubscription.listeners.get().length).toBe(1);
    });

    it('notices store updates between render and store subscription effect', () => {
        const app = createResa();

        let renderTimes = 0;

        const Child = () => {
            const [model] = useResa([MyModel]);
            renderTimes += 1;

            if (model.state.count === 0) {
                app.models.model.add();
            }

            return <div data-testid="id">{model.state.count}</div>;
        };

        rtl.render(
            <Provider resa={app}>
                <Child />
            </Provider>,
        );
        expect(renderTimes).toBe(2);
    });

    it('child should update after parent', async () => {
        const app = createResa();
        const renderedItems: any[] = [];

        const Parent = () => {
            const [model] = useResa([MyModel]);
            renderedItems.push(model.state.count);
            return <Child count={model.state.count} />;
        };

        const Child = ({ count }: any) => {
            const [model] = useResa([MyModel]);
            renderedItems.push(count);
            return (
                <div data-testid="id">
                    {model.state.count}-{count}
                </div>
            );
        };

        rtl.render(
            <Provider resa={app}>
                <Parent />
            </Provider>,
        );

        rtl.act(() => {
            app.models.model.add();
        });

        expect(renderedItems).toEqual([0, 0, 1, 1]);
    });
});
