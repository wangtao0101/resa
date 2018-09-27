import * as React from 'react';
import { ThemeContext } from './Provider';
import Model from '../decorators/Model';
import Subscription from 'react-redux/lib/utils/Subscription';
import createObservable from '../utils/createObservable';

/**
 * model meta info
 */
interface ModelMeta {
    depandenceMap: {};
    observableModel: any;
    name: string;
    state: any;
}

export class ThemeSubscribe extends React.Component<any, any> {
    resa: any;
    modelMetaArray: Array<ModelMeta>;
    resaKey: string;
    subscriptionKey: string;
    subscription: any;
    notifyNestedSubs: any;
    storeKey: any;
    theme: { [x: string]: any; [x: number]: any; storeKey: any };

    constructor(props) {
        super(props);
        this.storeKey = props.theme.storeKey;
        this.resaKey = `${this.storeKey}Resa`;
        this.subscriptionKey = `${this.storeKey}Subscription`;
        this.resa = props.theme[this.resaKey];
        this.modelMetaArray = [];
        this.tryRegister();
        this.updateObservable();
        this.initSubscription();
        this.theme = {
            [this.storeKey]: this.resa.store,
            [this.subscriptionKey]: this.subscription,
            [this.resaKey]: this.resa,
            storeKey: this.props.theme.storeKey,
        };
    }

    initSubscription() {
        const parentSub = this.props.theme[this.subscriptionKey];
        this.subscription = new Subscription(this.resa.store, parentSub, this.onStateChange.bind(this));
        this.notifyNestedSubs = this.subscription.notifyNestedSubs.bind(this.subscription);
    }

    tryRegister = () => {
        const models = this.resa.models;
        this.props.to.map(modelItem => {
            let name = '';
            let model = '';
            let instance = modelItem;
            if (typeof modelItem === 'object' && modelItem instanceof Model) {
                name = modelItem.name;
            } else {
                instance = new modelItem();
                name = instance.name;
            }
            model = models[name];
            if (model == null) {
                this.resa.registerModel(instance);
            }
            this.modelMetaArray.push({
                name,
                depandenceMap: {},
                observableModel: null,
                state: null,
            });
        });
    };

    updateObservable = () => {
        const models = this.resa.models;
        this.modelMetaArray = this.modelMetaArray.map(modelMeta => {
            const model = models[modelMeta.name];
            const state = model.state;
            // state is immutable
            if (modelMeta.state !== state) {
                modelMeta.state = state;
                modelMeta.observableModel = Object.assign({}, model, {
                    state: createObservable(state, modelMeta.depandenceMap),
                });
            }
            return modelMeta;
        });
    };

    shouldComponentUpdate(nextProps: any) {
        console.log(this.props.to.length);
        console.log('shouldComponentUpdate');
        console.log(nextProps);
        return true;
    }

    componentDidMount() {
        this.subscription.trySubscribe();
    }

    componentWillUnmount() {
        // unregister
    }

    calculateShouldUpdate = () => {
        const models = this.resa.models;
        return this.modelMetaArray.some(modelMeta => {
            const model = models[modelMeta.name];
            const state = model.state;
            const prevState = modelMeta.state;
            const dMap = modelMeta.depandenceMap;
            return Object.keys(dMap).some(key => {
                if (state[key] !== prevState[key]) {
                    return true;
                }
                return false;
            });
        });
    };

    onStateChange = () => {
        console.log(this.props.to.length);
        const shouldUpdate = this.calculateShouldUpdate();
        console.log(shouldUpdate);
        if (shouldUpdate) {
            this.componentDidUpdate = this.notifyNestedSubsOnComponentDidUpdate;
            // should updateObservable after call calculateShouldUpdate
            this.updateObservable();
            this.forceUpdate();
        } else {
            this.notifyNestedSubs();
        }
    };

    notifyNestedSubsOnComponentDidUpdate() {
        this.componentDidUpdate = undefined;
        this.notifyNestedSubs();
    }

    getSortedModel = () => {
        return this.modelMetaArray.map(modelMeta => {
            return modelMeta.observableModel;
        });
    };

    render() {
        console.log(this.props.to.length);
        console.log('render');
        return (
            <ThemeContext.Provider value={this.theme}>
                // @ts-ignore
                {this.props.children(...this.getSortedModel())}
            </ThemeContext.Provider>
        );
    }
}

export interface SubscribeProps {
    to: Array<any>;
    children(...instances: Array<any>): React.ReactNode;
}

const Subscribe = React.forwardRef((props: SubscribeProps, ref) => (
    <ThemeContext.Consumer>
        {theme => <ThemeSubscribe {...props} forwardedRef={ref} theme={theme} />}
    </ThemeContext.Consumer>
));

export default Subscribe;
