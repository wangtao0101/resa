import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import createResa, { Provider, connect } from './..';
import DecoratorChild from './decoratorChild';

const model = {
    name: 'model',
    effects: {
        * add(payload) {
            yield this.fulfilled(payload);
        },

        * minus(payload) {
            yield this.reject(payload);
        },
    },
};

const model1 = {
    name: 'model1',
    effects: {
        * add(payload) {
            yield this.fulfilled(payload);
        },

        * minus(payload) {
            yield this.reject(payload);
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
        app.registerModel(model, 'model');
        app.models.model.add({ a: 'a' });

        const mapStateToProps = ({ model }, state, ownProps) => ({ // eslint-disable-line
            a: state.model.a,
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

    test('mapDispatchToProps can get wapperInstance by setting connectOptions withref', () => {
        const app = createResa();

        const ConnectedChild = connect(null, null, null, { withRef: true })(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        const wapper = TestUtils.findRenderedComponentWithType(tree, ConnectedChild);
        expect(wapper.getWrappedInstance()).toEqual(container);
    });

    test('mapDispatchToProps can bind app name and get model in mapdispathtoprops', () => {
        const app = createResa();
        app.registerModel(model, 'model');
        app.registerModel(model1, 'model1');
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
        app.registerModel(model, 'model1');

        const mapStateToProps = (_app, _state) => ({
            a: 'a',
        });

        const ConnectedChild = connect(mapStateToProps, ['model'])(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');
        expect(container.props.model.name).toEqual('model');
    });

    test('conncet model decorator success', () => {
        const app = createResa();
        app.registerModel(model, 'model1');

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <DecoratorChild />
            </Provider>
        );

        const container = TestUtils.findRenderedComponentWithType(tree, DecoratorChild).getWrappedInstance();
        expect(container.props.a).toEqual('a');

        expect(container.props.model.name).toEqual('model');
    });
});
