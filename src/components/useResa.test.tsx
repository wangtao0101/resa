import * as React from 'react';
import createResa, { subscribe, Provider, init, Model, effect, ResaHookWrap, useResa } from 'resa';
import * as rtl from 'react-testing-library';
import 'jest-dom/extend-expect';

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
    it('render without error', async () => {
        const app = createResa();

        const WrapChild = ResaHookWrap()(() => {
            const [model] = useResa([MyModel]);
            return <div data-testid="id">{model.state.count}</div>;
        });

        const tester = rtl.render(
            <Provider resa={app}>
                <WrapChild />
            </Provider>,
        );
        expect(tester.getByTestId('id')).toHaveTextContent('0');
    });
});
