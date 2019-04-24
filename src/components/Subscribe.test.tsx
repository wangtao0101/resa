import * as React from 'react';
import createResa, { subscribe, Provider, init, Model, effect } from 'resa';
import * as TestUtils from 'react-dom/test-utils';

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
            count: this.state.count + 1,
        });
    }
}

class Child extends React.Component<any, any> {
    render() {
        return <div>{this.props.myModel.state.count}</div>;
    }
}

describe('Subscribe', () => {
    it('should pass own props', async () => {
        const app = createResa();
        interface TempChildProps {
            myModel: MyModel;
            k: string;
        }
        class TempChild extends React.Component<TempChildProps, any> {
            render() {
                return <div>{this.props.myModel.state.count}</div>;
            }
        }
        const SubscribeChild = subscribe({ myModel: MyModel })(TempChild);
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeChild k="k" />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, TempChild);
        expect(container.props.k).toEqual('k');
    });

    it('calculateShouldUpdate should return true only when update used states', async () => {
        const app = createResa();
        const SubscribeChild = subscribe({ myModel: MyModel })(Child);
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeChild />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        container.render = jest.fn();
        app.models.model.add();
        app.models.model.ss();
        expect(container.render).toBeCalledTimes(1);
    });

    it('should call render if state.length in dependence changed', async () => {
        const app = createResa();
        const SubscribeChild = subscribe({ myModel: MyModel }, ['length'])(Child);
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeChild />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        container.render = jest.fn();
        app.models.model.add();
        app.models.model.ss();
        expect(container.render).toBeCalledTimes(2);
    });

    it('should notify nested sub only changed state', async () => {
        const app = createResa();

        class SencondChild extends React.Component<any, any> {
            render() {
                return <div>{this.props.secondModel.state.count}</div>;
            }
        }

        const SubscribeSencondChild = subscribe({ myModel: MyModel, secondModel: SecondModel })(SencondChild);

        class FirstChild extends React.Component<any, any> {
            render() {
                return (
                    <div>
                        {this.props.myModel.state.count}
                        <SubscribeSencondChild ll="asdf" />
                    </div>
                );
            }
        }

        const SubscribeFirstChild = subscribe({ myModel: MyModel })(FirstChild);

        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeFirstChild />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, SencondChild);
        container.render = jest.fn();
        app.models.model.add();
        expect(container.render).toBeCalledTimes(0);
        app.models.sencondModel.add();
        expect(container.render).toBeCalledTimes(1);
    });

    it('should render after ownProps changed', async () => {
        const app = createResa();
        const SubscribeChild = subscribe({ myModel: MyModel })(Child);
        class Father extends React.Component<any, any> {
            state = {
                attr: 'a',
            };

            changeProps = () => {
                this.setState({
                    attr: 'b',
                });
            };

            render() {
                return (
                    <div>
                        <SubscribeChild attr={this.state.attr} />
                    </div>
                );
            }
        }
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <Father />
            </Provider>,
        );
        const child = TestUtils.findRenderedComponentWithType(tree, Child);
        const father = TestUtils.findRenderedComponentWithType(tree, Father);
        child.render = jest.fn();
        father.changeProps();
        expect(child.render).toBeCalledTimes(1);
    });

    it('should throw two same model name error', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            @init<any>({
                name: 'model',
                state: {},
            })
            class SameModel extends Model<any> {}

            const app: any = createResa();
            const SubscribeChild = subscribe({ myModel: MyModel, sameModel: SameModel })(Child);
            TestUtils.renderIntoDocument(
                <Provider resa={app}>
                    <SubscribeChild />
                </Provider>,
            );
        }).toThrow(/Different Model should not use the same model name, Please check name: model/);

        spy.mockRestore();
    });

    it('should throw The shape of state must be an object', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            @init<any>({
                name: 'model',
                state: 0,
            })
            class SameModel extends Model<any> {}
            const app: any = createResa();

            const SubscribeChild = subscribe({ sameModel: SameModel })(Child);
            TestUtils.renderIntoDocument(
                <Provider resa={app}>
                    <SubscribeChild />
                </Provider>,
            );
        }).toThrow(/The shape of state must be an object/);

        spy.mockRestore();
    });

    it('get ref using React.createRef()', () => {
        const app = createResa();
        const SubscribeChild = subscribe({ myModel: MyModel }, [], { forwardRef: true })(Child);

        const ref = React.createRef();

        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeChild ref={ref} />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, Child);

        expect(ref.current).toEqual(container);
    });
});

@init<MyModelState>({
    name: 'model',
    namespace: 'namespace',
    state: {
        count: 0,
    },
})
class NamespaceModel extends Model<MyModelState> {
    @effect()
    *add() {
        this.fulfilled({
            count: this.state.count + 1,
        });
    }
}

@init<MyModelState>({
    name: 'model1',
    namespace: 'namespace1',
    state: {
        count: 0,
    },
})
class NamespaceModel1 extends Model<MyModelState> {
    @effect()
    *add() {
        this.fulfilled({
            count: this.state.count + 1,
        });
    }
}

@init<MyModelState>({
    name: 'model1',
    state: {
        count: 0,
    },
})
class ConnectedModel extends Model<MyModelState> {
    @effect()
    *add() {
        this.fulfilled({
            count: this.state.count + 1,
        });
    }
}

describe('Subscribe namespace', () => {
    it('put model in namespace', () => {
        const app = createResa();
        const SubscribeChild = subscribe({ myModel: NamespaceModel })(Child);
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeChild />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        container.render = jest.fn();
        app.models['namespace/model'].add();
        expect(container.render).toBeCalledTimes(1);
    });

    it('subscrbe two model in different namespace', () => {
        const app = createResa();
        class Child extends React.Component<any, any> {
            render() {
                return (
                    <div>
                        {this.props.myModel.state.count}
                        {this.props.myModel1.state.count}
                    </div>
                );
            }
        }
        const SubscribeChild = subscribe({ myModel: NamespaceModel, myModel1: NamespaceModel1 })(Child);
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeChild />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        container.render = jest.fn();
        app.models['namespace/model'].add();
        app.models['namespace1/model1'].add();
        expect(container.render).toBeCalledTimes(2);
    });

    it('subscribe connected model', () => {
        const app = createResa();
        app.registerModel(new ConnectedModel());

        class Child extends React.Component<any, any> {
            render() {
                return (
                    <div>
                        {this.props.myModel.state.count}
                        {this.props.myModel1.state.count}
                    </div>
                );
            }
        }
        const SubscribeChild = subscribe({ myModel: NamespaceModel, myModel1: ConnectedModel })(Child);
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <SubscribeChild />
            </Provider>,
        );
        const container = TestUtils.findRenderedComponentWithType(tree, Child);
        container.render = jest.fn();
        app.models['namespace/model'].add();
        app.models.model1.add();
        expect(container.render).toBeCalledTimes(2);
    });
});
