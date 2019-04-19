import * as React from 'react';
import ResaContext from './Context';
import { useMemo, useRef, useCallback, useLayoutEffect, useReducer } from 'react';
import createObservable from '../utils/createObservable';

interface ModelMeta {
    depandenceMap: {};
    observableModel: any;
    name: string;
    state: any;
}

function storeStateUpdatesReducer(state) {
    const [updateCount] = state;
    return [updateCount + 1];
}

const initStateUpdates = () => [0];

const EMPTY_ARRAY = [];

export default function useResa(models: any[] = [], dependences: string[] = [], Context = ResaContext) {
    const contextValue: any = React.useContext(Context);
    const isInit = useRef(true);
    const modelMetas = useRef<ModelMeta[]>(new Array(models.length));
    const resultModels = useRef(new Array(models.length));

    const store = contextValue.store;
    const resa = store.resa;
    const subscription = contextValue.subscription;

    const [[previousStateUpdateResult], forceComponentUpdateDispatch] = useReducer(
        storeStateUpdatesReducer,
        EMPTY_ARRAY,
        initStateUpdates,
    );

    const [notifyNestedSubs] = useMemo(() => {
        const notifyNestedSubs = subscription.notifyNestedSubs.bind(subscription);
        return [notifyNestedSubs];
    }, [store, contextValue]);

    const updateObservable = useCallback(() => {
        const models = resa.models;
        const returnModels = new Array(models.length);
        modelMetas.current.map((modelMeta, index) => {
            const model = models[modelMeta.name];
            const state = model.state;
            // state is immutable
            if (modelMeta.state !== state) {
                modelMeta.state = state;
                modelMeta.observableModel = Object.assign({}, model, {
                    state: createObservable(state, modelMeta.depandenceMap),
                });
            }
            returnModels[index] = modelMeta.observableModel;
        });

        resultModels.current = returnModels;
    }, []);

    const tryRegister = useCallback(() => {
        const resaModels = resa.models;
        models.map((modelItem, index) => {
            const instance = new modelItem();
            const namespace = instance.namespace;
            const name = namespace === '' ? instance.name : `${namespace}/${instance.name}`;
            const model = resaModels[name];

            if (model == null) {
                resa.register(instance);
            }
            const depandenceMap = {};
            dependences.map((dp: string) => {
                depandenceMap[dp] = true;
            });
            modelMetas.current[index] = {
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
        return modelMetas.current.some(modelMeta => {
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

                forceComponentUpdateDispatch({
                    type: 'STORE_UPDATED',
                });
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

    return resultModels.current;
}
