import * as React from 'react';
import * as TestUtils from 'react-dom/test-utils';
import createResa, { Provider, connect } from 'resa';
import DecoratorChild from './decoratorChild';

const model = {
    name: 'model',
    state: {},
    effects: {
        *add(payload) {
            // @ts-ignore
            this.fulfilled(payload);
            yield 1;
        },

        *minus(payload) {
            // @ts-ignore
            this.reject(payload);
            yield 1;
        },
    },
};

const model1 = {
    name: 'model1',
    state: {},
    effects: {
        *add(payload) {
            // @ts-ignore
            this.fulfilled(payload);
            yield 1;
        },

        *minus(payload) {
            // @ts-ignore
            this.reject(payload);
            yield 1;
        },
    },
};

class Child extends React.Component {
    // eslint-disable-line
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

        const func = () => {};

        const mapDispatchToProps = (_app, _dispatch) => ({
            func,
        });

        const ConnectedChild = connect(
            mapStateToProps,
            mapDispatchToProps,
        )(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>,
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');
        expect(container.props.func).toEqual(func);
    });

    test('mapStateToProps can get app and state', () => {
        const app = createResa();
        app.registerModel(model, 'model');
        app.models.model.add({ a: 'a' });

        const mapStateToProps = ({ model }, state, ownProps) => ({
            // eslint-disable-line
            a: state.model.a,
            ownProps,
        });

        // @ts-ignore
        const ConnectedChild = connect(mapStateToProps)(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild c={'c'} />
            </Provider>,
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');
        expect(container.props.ownProps).toEqual({ c: 'c', theme: expect.anything() });
    });

    test('mapDispatchToProps can get models and dispatch', () => {
        const app = createResa();
        const mapDispatchToProps = (models, dispatch) => ({
            func: () => ({
                models,
                dispatch,
            }),
        });

        const ConnectedChild = connect(
            null,
            mapDispatchToProps,
        )(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>,
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.func()).toEqual({
            models: app.models,
            dispatch: app.store.dispatch,
        });
    });

    test('get wapperInstance using React.createRef()', () => {
        const app = createResa();

        const ConnectedChild = connect(
            null,
            null,
            null,
            { forwardRef: true },
        )(Child);

        const ref = React.createRef();

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild ref={ref} c={'c'} />
            </Provider>,
        );

        const child = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(ref.current).toEqual(child);
    });

    test('should use React.createRef()', () => {
        const app = createResa();

        const ConnectedChild = connect(
            null,
            null,
            null,
            { forwardRef: true },
        )(Child);

        const ref = () => {};

        expect(() => {
            TestUtils.renderIntoDocument(
                <Provider store={app.store} resa={app}>
                    <ConnectedChild ref={ref} />
                </Provider>,
            );
        }).toThrow('You must use React.createRef() to create ref.');
    });

    test('mapDispatchToProps can bind app name and get model in mapdispathtoprops', () => {
        const app = createResa();
        app.registerModel(model, 'model');
        app.registerModel(model1, 'model1');
        const mapDispatchToProps = ({ model, model1 }, dispatch) => ({
            // eslint-disable-line
            func: () => ({
                dispatch,
                model,
                model1,
            }),
        });

        // @ts-ignore
        const ConnectedChild = connect(
            null,
            mapDispatchToProps,
        )(Child, 'model', 'model1');

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>,
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

        const ConnectedChild = connect(
            mapStateToProps,
            ['model'],
        )(Child);

        const tree = TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <ConnectedChild />
            </Provider>,
        );

        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(container.props.a).toEqual('a');
        expect(container.props.model.name).toEqual('model');
    });

    test('conncet model decorator success', () => {
        const app = createResa();
        app.registerModel(model, 'model1');

        const ref = React.createRef();

        const DecoratorChildAny: any = DecoratorChild;

        TestUtils.renderIntoDocument(
            <Provider store={app.store} resa={app}>
                <DecoratorChildAny ref={ref} />
            </Provider>,
        );

        // @ts-ignore
        expect(ref.current.props.a).toEqual('a');
        // @ts-ignore
        expect(ref.current.props.model.name).toEqual('model');
    });
});
