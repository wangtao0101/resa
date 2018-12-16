import * as React from 'react';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import { ThemeContext } from './Provider';
import Subscription from 'react-redux/lib/utils/Subscription';
import createObservable from '../utils/createObservable';
import * as invariant from 'invariant';

/**
 * model meta info
 */
interface ModelMeta {
    depandenceMap: {};
    observableModel: any;
    name: string;
    state: any;
}

interface SubscribeProps {
    theme: any;
    forwardedRef: any;
}


function checkModelType(model, modelTypeName) {
    const instanceCon = modelTypeName[model.name];
    if (instanceCon == null) {
        modelTypeName[model.name] = model.constructor;
    } else {
        invariant(instanceCon === model.constructor, `Different Model should not use the same model name, Please check name: ${model.name}`);
    }
}

export default function subscribe(modelMap, dependences: string[] = []) {
    return function wrapWithSubscribe(WrappedComponent) {
        class Subscribe extends React.PureComponent<SubscribeProps, any> {
            resa: any;
            modelMetaMap: { [x: string]: ModelMeta };
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
                this.modelMetaMap = {};
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
                Object.keys(modelMap).map(key => {
                    const modelItem = modelMap[key];
                    const instance = new modelItem();

                    if (process.env.NODE_ENV !== 'production') {
                        checkModelType(instance, this.resa.modelTypeName);

                        invariant(Object.prototype.toString.call(instance.state) === '[object Object]', 'The shape of state must be an object');
                    }

                    const namespace = instance.namespace;
                    const name = namespace === '' ? instance.name : `${namespace}/${instance.name}` ;
                    const model = models[name];
                    if (model == null) {
                        this.resa.register(instance, namespace);
                    }
                    const depandenceMap = {};
                    dependences.map((dp: string) => {
                        depandenceMap[dp] = true;
                    })
                    this.modelMetaMap[key] = {
                        name,
                        depandenceMap,
                        observableModel: null,
                        state: null,
                    };
                });
            };

            updateObservable = () => {
                const models = this.resa.models;
                Object.keys(this.modelMetaMap).map(key => {
                    const modelMeta = this.modelMetaMap[key];
                    const model = models[modelMeta.name];
                    const state = model.state;
                    // state is immutable
                    if (modelMeta.state !== state) {
                        modelMeta.state = state;
                        modelMeta.observableModel = Object.assign({}, model, {
                            state: createObservable(state, modelMeta.depandenceMap),
                        });
                    }
                });
            };

            componentDidMount() {
                this.subscription.trySubscribe();
            }

            calculateShouldUpdate = () => {
                const models = this.resa.models;
                return Object.keys(this.modelMetaMap).some(key => {
                    const modelMeta = this.modelMetaMap[key];
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
                const shouldUpdate = this.calculateShouldUpdate();
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

            getModels = () => {
                const returnMap = {};
                Object.keys(this.modelMetaMap).map(key => {
                    returnMap[key] = this.modelMetaMap[key].observableModel;
                });
                return returnMap;
            };

            render() {
                const { theme, forwardedRef, ...rest } = this.props;
                return (
                    <ThemeContext.Provider value={this.theme}>
                        <WrappedComponent ref={forwardedRef} {...rest} {...this.getModels()} />
                    </ThemeContext.Provider>
                );
            }
        }

        // @ts-ignore
        Subscribe.WrappedComponent = WrappedComponent;
        const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
        // @ts-ignore
        Subscribe.displayName = `ResaSubscribe(${wrappedComponentName})`;
        // @ts-ignore
        const TargetComponent = hoistNonReactStatic(Subscribe, WrappedComponent);

        return React.forwardRef((props: any, ref: any) => (
            <ThemeContext.Consumer>
                {theme => <TargetComponent {...props} forwardedRef={ref} theme={theme} />}
            </ThemeContext.Consumer>
        ));
    };
}
