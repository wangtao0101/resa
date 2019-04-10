import * as React from 'react';
import { ResaContext } from './Context';
import * as rtl from 'react-testing-library';
import createResa from '../createResa';
import Provider from './Provider';

describe('Provider', () => {
    afterEach(() => rtl.cleanup());

    const createChild = () => {
        class Child extends React.Component {
            render() {
                return (
                    <ResaContext.Consumer>
                        {({ store }) => {
                            return <div data-testid="store">{store.getState().toString()}</div>;
                        }}
                    </ResaContext.Consumer>
                );
            }
        }
        return Child;
    };
    const Child = createChild();

    test('pass store and store.resa to redux provider', () => {
        const app = createResa();

        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() =>
            rtl.render(
                <Provider resa={app}>
                    <Child />
                </Provider>,
            ),
        ).not.toThrow();

        spy.mockRestore();
    });
});
