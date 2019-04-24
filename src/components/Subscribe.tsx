import * as React from 'react';
import Subscription from 'react-redux/lib/utils/Subscription';
import createObservable from '../utils/createObservable';
import { useCallback, useMemo, useLayoutEffect, useRef, useReducer } from 'react';
import ResaContext from './Context';
import { forwardComponent, checkModelType } from '../utils/help';

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
    forwardedRef: any;
}

interface ExtraOptions {
    forwardRef?: any;
    context?: any;
}

export default function subscribe(modelMap, dependences: string[] = [], extraOptions: ExtraOptions = {}) {
    return function wrapWithSubscribe(WrappedComponent) {
        const Context = extraOptions.context || ResaContext;

        const Subscribe = React.memo(function(props: SubscribeProps) {
            const contextValue: any = React.useContext(Context);
            const store = contextValue.store;
            const resa = store.resa;

            const modelMetaMap = useRef({});
            const modelMapChildProps = useRef({});
            const isInit = useRef(true);

            const [forwardedRef, wrapperProps] = useMemo(() => {
                const { forwardedRef, ...wrapperProps } = props;
                return [forwardedRef, wrapperProps];
            }, [props]);

            const [subscription, notifyNestedSubs] = useMemo(() => {
                const subscription = new Subscription(store, contextValue.subscription);

                const notifyNestedSubs = subscription.notifyNestedSubs.bind(subscription);
                return [subscription, notifyNestedSubs];
            }, [store, , contextValue]);

            const overriddenContextValue = useMemo(() => {
                return {
                    ...contextValue,
                    subscription,
                };
            }, [contextValue, subscription]);

            const [, forceRender] = useReducer(s => s + 1, 0);

            const updateObservable = useCallback(() => {
                const models = resa.models;
                const returnMap = {};
                Object.keys(modelMetaMap.current).map(key => {
                    const modelMeta: ModelMeta = modelMetaMap.current[key];
                    const model = models[modelMeta.name];
                    const state = model.state;
                    // state is immutable
                    if (modelMeta.state !== state) {
                        modelMeta.state = state;
                        modelMeta.observableModel = Object.assign({}, model, {
                            state: createObservable(state, modelMeta.depandenceMap),
                        });
                    }
                    returnMap[key] = modelMeta.observableModel;
                });

                modelMapChildProps.current = returnMap;
            }, []);

            const tryRegister = useCallback(() => {
                const models = resa.models;
                Object.keys(modelMap).map(key => {
                    const modelItem = modelMap[key];
                    const instance = new modelItem();
                    const namespace = instance.namespace;
                    const name = namespace === '' ? instance.name : `${namespace}/${instance.name}`;
                    const model = models[name];

                    if (process.env.NODE_ENV !== 'production') {
                        checkModelType(instance, name, resa.modelTypeName);
                    }

                    if (model == null) {
                        resa.register(instance);
                    }
                    const depandenceMap = {};
                    dependences.map((dp: string) => {
                        depandenceMap[dp] = true;
                    });
                    modelMetaMap.current[key] = {
                        name,
                        depandenceMap,
                        observableModel: null,
                        state: null,
                    };
                });

                updateObservable();
                isInit.current = false;
            }, []);

            if (isInit.current) {
                tryRegister();
            }

            const calculateShouldUpdate = useCallback(() => {
                const models = resa.models;
                return Object.keys(modelMetaMap.current).some(key => {
                    const modelMeta = modelMetaMap.current[key];
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
            }, []);

            const childPropsFromStoreUpdate = useRef(false);

            useLayoutEffect(() => {
                // If the render was from a store update, clear out that reference and cascade the subscriber update
                if (childPropsFromStoreUpdate.current) {
                    childPropsFromStoreUpdate.current = false;
                    notifyNestedSubs();
                }
            });

            useLayoutEffect(() => {
                let didUnsubscribe = false;

                const onStateChange = () => {
                    if (didUnsubscribe) {
                        return;
                    }

                    const shouldUpdate = calculateShouldUpdate();
                    if (shouldUpdate) {
                        updateObservable();
                        childPropsFromStoreUpdate.current = true;

                        forceRender({});
                    } else {
                        notifyNestedSubs();
                    }
                };

                subscription.onStateChange = onStateChange;
                subscription.trySubscribe();

                return () => {
                    didUnsubscribe = true;
                    subscription.tryUnsubscribe();
                };
            }, [store, subscription]);

            const renderChild = useMemo(() => {
                return (
                    <Context.Provider value={overriddenContextValue}>
                        <WrappedComponent ref={forwardedRef} {...wrapperProps} {...modelMapChildProps.current} />
                    </Context.Provider>
                );
            }, [forwardedRef, wrapperProps, modelMapChildProps.current]);

            return renderChild;
        });

        return forwardComponent(extraOptions.forwardRef, Subscribe, WrappedComponent, 'ResaSubscribe');
    };
}
