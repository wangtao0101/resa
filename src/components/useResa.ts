import * as React from 'react';
import Subscription from 'react-redux/lib/utils/Subscription';
import ResaContext from './Context';
import { useMemo, useRef, useCallback, useLayoutEffect, useReducer } from 'react';
import createObservable from '../utils/createObservable';
import { checkModelType } from '../utils/help';

interface ModelMeta {
    depandenceMap: {};
    observableModel: any;
    name: string;
    state: any;
}

export default function useResa(models: any[] = [], dependences: string[] = [], Context = ResaContext) {
    const contextValue: any = React.useContext(Context);
    const isInit = useRef(true);
    const modelMetas = useRef<ModelMeta[]>(new Array(models.length));
    const resultModels = useRef(new Array(models.length));

    const store = contextValue.store;
    const resa = store.resa;

    const [, forceRender] = useReducer(s => s + 1, 0);

    const subscription = useMemo(() => new Subscription(store, contextValue.subscription), [
        store,
        contextValue.subscription,
    ]);

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

    useLayoutEffect(() => {
        const onStateChange = () => {
            const shouldUpdate = calculateShouldUpdate();
            if (shouldUpdate) {
                updateObservable();

                forceRender({});
            }
        };

        subscription.onStateChange = onStateChange;
        subscription.trySubscribe();

        return () => {
            subscription.tryUnsubscribe();
        };
    }, [store, subscription]);

    return resultModels.current;
}
