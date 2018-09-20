import * as React from 'react';
import { ThemeContext } from './Provider';
import Model from '../decorators/Model';
import Subscription from 'react-redux/lib/utils/Subscription';
import createObservable from '../createObservable';

/**
 * model meta info
 */
interface ModelMeta {
    depandenceMap: {};
    observableModel: any;
    name: string;
    state: any;
}

class ThemeSubscribe extends React.PureComponent<any, any> {
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
            if (typeof modelItem === 'object' && modelItem instanceof Model) {
                const name = modelItem.name;
                const model = models[name];
                if (model == null) {
                    this.resa.registerModel(modelItem);
                }
                this.modelMetaArray.push({
                    name,
                    depandenceMap: {},
                    observableModel: null,
                    state: null,
                })
            } else {
                // TODO:
                // console.log('bbbbbbbbbb');
            }
        });
    };

    updateObservable = () => {
        const models = this.resa.models;
        this.modelMetaArray = this.modelMetaArray.map(modelMeta => {
            const model = models[modelMeta.name];
            const state = model.state;
            // assumption state is immutable
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

    }

    onStateChange = () => {
        console.log('onStateChange');
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
