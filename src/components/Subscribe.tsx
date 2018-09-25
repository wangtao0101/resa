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

export class ThemeSubscribe extends React.PureComponent<any, any> {
    resa: any;
    modelMetaArray: Array<ModelMeta>;
    resaKey: string;
    subscriptionKey: string;
    subscription: any;

    constructor(props) {
        super(props);
        const storeKey = props.theme.storeKey;
        this.resaKey = `${storeKey}Resa`;
        this.subscriptionKey = `${storeKey}Subscription`;
        this.resa = props.theme[this.resaKey];
        this.modelMetaArray = [];
        this.tryRegister();
        this.updateObservable();
        this.initSubscription();
    }

    initSubscription() {
        const parentSub = this.props.theme[this.subscriptionKey];
        this.subscription = new Subscription(this.resa.store, parentSub, this.onStateChange.bind(this));
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
            })
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
                modelMeta.observableModel = Object.assign({}, model, { state: createObservable(state, modelMeta.depandenceMap) });
            }
            return modelMeta;
        });
    };

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
            })
        });
    }

    onStateChange = () => {
        if (this.calculateShouldUpdate()) {
            // should updateObservable after call calculateShouldUpdate
            this.updateObservable();
            this.forceUpdate();
        }
        // TODO: call nextedSub
    };

    getSortedModel = () => {
        return this.modelMetaArray.map(modelMeta => {
            return modelMeta.observableModel;
        });
    }

    render() {
        // @ts-ignore
        return this.props.children(...this.getSortedModel());
    }
}

export interface SubscribeProps {
    to: [any];
    children(...instances: [any]): React.ReactNode;
}

const Subscribe = React.forwardRef((props: SubscribeProps, ref) => (
    <ThemeContext.Consumer>
        {theme => <ThemeSubscribe {...props} forwardedRef={ref} theme={theme} />}
    </ThemeContext.Consumer>
));

export default Subscribe;
