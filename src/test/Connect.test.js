import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import createResa, { Provider, connect } from './..';

const model = {
    namespace: 'model',
    reducer: 'model',
    effects: {
        * add(_app, action, { fulfilled, _reject }) {
            yield fulfilled(action.payload);
        },

        * minus(_app, action, { _fulfilled, reject }) {
            yield reject(action.payload);
        },
    },
};

describe('Connect', () => {
    class Child extends Component { // eslint-disable-line
        render() {
            return <div />;
        }
    }

    test('should pass state and props to the given component', () => {
        const app = createResa();

        const mapStateToProps = (_app, _state) => ({
            a: 'a',
        });

        const func = () => { };

        const mapDispatchToProps = (_app, _dispatch) => ({
            func,
        });

        const ConnectedChild = connect(mapStateToProps, mapDispatchToProps)(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');
        expect(container.props.func).toEqual(func);
    });

    test('mapStateToProps can get app and state', () => {
        const app = createResa();
        app.registerModel(model);
        app.model.model.effects.add({ a: 'a' });

        const mapStateToProps = (resa, state) => ({
            a: state.model.a,
            loading: resa.model.model.getState().loading,
        });

        const ConnectedChild = connect(mapStateToProps)(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');
        expect(container.props.loading).toEqual(false);
    });

    test('mapDispatchToProps can get app and dispatch', () => {
        const app = createResa();
        const mapDispatchToProps = (resa, dispatch) => ({
            func: () => ({
                app: resa,
                dispatch,
            }),
        });

        const ConnectedChild = connect(null, mapDispatchToProps)(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.func()).toEqual({
            app,
            dispatch: app.store.dispatch,
        });
    });
});
