import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import createResa, { Provider, connect, connectModel } from './..';

const model = {
    namespace: 'model',
    reducerName: 'model',
    effects: {
        * add(_app, action, { fulfilled, _reject }) {
            yield fulfilled(action.payload);
        },

        * minus(_app, action, { _fulfilled, reject }) {
            yield reject(action.payload);
        },
    },
};

const model1 = {
    namespace: 'model1',
    reducerName: 'model1',
    effects: {
        * add(_app, action, { fulfilled, _reject }) {
            yield fulfilled(action.payload);
        },

        * minus(_app, action, { _fulfilled, reject }) {
            yield reject(action.payload);
        },
    },
};

class Child extends Component { // eslint-disable-line
    render() {
        return <div />;
    }
}

describe('Connect', () => {
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
        app.models.model.effects.add({ a: 'a' });

        const mapStateToProps = ({ model }, state, ownProps) => ({ // eslint-disable-line
            a: state.model.a,
            loading: model.getState().loading,
            ownProps,
        });

        const ConnectedChild = connect(mapStateToProps)(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild c={'c'} />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');
        expect(container.props.loading).toEqual(false);
        expect(container.props.ownProps).toEqual({ c: 'c' });
    });

    test('mapDispatchToProps can get models and dispatch', () => {
        const app = createResa();
        const mapDispatchToProps = (models, dispatch) => ({
            func: () => ({
                models,
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
            models: app.models,
            dispatch: app.store.dispatch,
        });
    });

    test('mapDispatchToProps can bind app namespace and get model in mapdispathtoprops', () => {
        const app = createResa();
        app.registerModel(model);
        app.registerModel(model1);
        const mapDispatchToProps = ({ model, model1 }, dispatch) => ({ // eslint-disable-line
            func: () => ({
                dispatch,
                model,
                model1,
            }),
        });

        const ConnectedChild = connect(null, mapDispatchToProps)(Child, 'model', 'model1');

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.func()).toEqual({
            dispatch: app.store.dispatch,
            model: app.models.model,
            model1: app.models.model1,
        });
    });
});


describe('connectModel', () => {
    test('conncet model success', () => {
        const app = createResa();
        app.registerModel(model);

        const mapStateToProps = (_app, _state) => ({
            a: 'a',
        });

        const ConnectedChild = connectModel(mapStateToProps, ['model'])(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');

        const newModel = Object.assign({}, {
            effects: app.models.model.effects,
            reducers: app.models.model.reducers,
        });
        expect(container.props.model).toEqual(newModel);
    });
});
