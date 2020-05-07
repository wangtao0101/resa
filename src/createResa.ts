import { applyMiddleware, createStore, combineReducers, compose } from 'redux';
import { combineReducers as combineImmutableReducers } from 'redux-immutable';
import createSagaMiddleware from 'redux-saga';
import * as invariant from 'invariant';
import { call, fork, take, cancel, takeEvery, takeLatest, throttle } from 'redux-saga/effects';
import { reduxSagaMiddleware } from 'redux-saga-middleware';
import { createAction, handleActions } from './utils/action';
import isImmutable from './utils/predicates';
import { COMBINED_RESA_MODEL } from './utils/combineModel';
import { cloneState, getStateDelegate } from './utils/help';
import * as Redux from 'redux';

// is root model
const ROOT_MODEL = '@@__ROOT_MODEL__@@';

const ActionTypes = {
    INIT: '@@redux/INIT',
    CANCEL_EFFECTS: '@@CANCEL_EFFECTS',
};

const noop = () => {};

const payloadEncode = (...args) => {
    const payload = {
        __resa__payload__: true,
    };
    args.forEach((item, i) => {
        payload[i] = item;
    });
    return payload;
};

const payloadDecode = payload => {
    if (payload.__resa__payload__) {
        delete payload.__resa__payload__;
        return Object.keys(payload).map(k => payload[k]);
    }
    return payload;
};

export interface Options {
    reducers?: Redux.ReducersMapObject;
    reduxDevToolOptions?: Object;
    remoteReduxDevtools?: boolean;
    errorHandle?: (error: Error) => void;
    middlewares?: Array<Redux.Middleware>;
    initialState?: any;
}

export default function createResa(options?: Options) {
    const { reducers = {}, errorHandle = noop, reduxDevToolOptions = {}, initialState = {}, middlewares = [], remoteReduxDevtools = false } =
        options || {};

    function resaReducer(state = {}, _action) {
        return state;
    }

    const initReducer = {
        ...reducers,
        resaReducer,
    };

    function combineReducersInner(asyncReducers, state) {
        if (isImmutable(state)) {
            return combineImmutableReducers({
                ...asyncReducers,
            });
        }
        return combineReducers({
            ...asyncReducers,
        });
    }

    function makeRootReducer(asyncReducers, matrixReducers) {
        const finalMatrixReducers = {};
        Object.keys(matrixReducers).map(key => {
            const maybeReducer = matrixReducers[key];
            if (typeof maybeReducer === 'function') {
                finalMatrixReducers[key] = maybeReducer;
            } else {
                finalMatrixReducers[key] = combineReducersInner(maybeReducer, {});
            }
        });
        return combineReducersInner(
            {
                ...initReducer,
                ...asyncReducers,
                ...finalMatrixReducers,
            },
            initialState,
        );
    }

    // immutable merge bug see https://github.com/facebook/immutable-js/issues/1293
    function mergeImmutablePayload(state, payload = {}) {
        if (isImmutable(payload)) {
            return state.withMutations(map => {
                // @ts-ignore
                payload.map((value, key) => {
                    map.set(key, value);
                    return null;
                });
            });
        }
        return state.withMutations(map => {
            Object.keys(payload).map(key => {
                map.set(key, payload[key]);
                return null;
            });
        });
    }

    function commonReducerHandle(state, payload) {
        if (payload == null) {
            return state;
        }
        if (isImmutable(state)) {
            return mergeImmutablePayload(state, payload);
        }
        if (Object.prototype.toString.call(state) === '[object Object]') {
            invariant(
                Object.prototype.toString.call(payload) === '[object Object]',
                'The payload must be an object if the shape of state is object',
            );
            return Object.assign({}, state, payload);
        }
        return payload;
    }

    function getEffectSaga(models, saga, effectName, dispatch) {
        return function*(action) {
            const { resolve, reject, ...rest } = action;
            try {
                const that = Object.assign({}, models[effectName], dispatch, { models });
                // @ts-ignore
                const result = yield call([that, saga], ...payloadDecode(rest.payload));
                resolve(result);
            } catch (error) {
                errorHandle(error);
                reject(error);
            }
        };
    }

    function getSaga(app, action, effect, effectName, dispatch) {
        let type = 'takeEvery';
        let actualEffect = effect;
        if (Array.isArray(effect)) {
            type = effect[1];
            actualEffect = effect[0];

            invariant(
                ['takeEvery', 'takeLatest', 'throttle', 'takeFirst'].indexOf(type) > -1,
                'effect type should be takeEvery, takeFirst, takeLatest or throttle.',
            );

            if (type === 'throttle') {
                invariant(
                    Number.isInteger(effect[2]) === true && effect[2] > 0,
                    'ms of throttle should be positive integer.',
                );
            }
        }

        const effectSaga = getEffectSaga(app.models, actualEffect, effectName, dispatch);

        switch (type) {
            case 'takeFirst':
                return function*() {
                    while (true) {
                        const at = yield take(action.pending);
                        yield call(effectSaga, at);
                    }
                };
            case 'takeLatest':
                return function*() {
                    yield takeLatest(action.pending, effectSaga);
                };
            case 'throttle':
                return function*() {
                    yield throttle(effect[2], action.pending, effectSaga);
                };
            default:
                return function*() {
                    yield takeEvery(action.pending, effectSaga);
                };
        }
    }

    function runSagaAndReturnActionCreators(model, app, namespace = '') {
        const actions = {};
        const { store, runSaga } = app;

        const newEffects = {};
        const oldEffects = model.effects || {};
        const effectName = namespace === '' ? model.name : `${namespace}/${model.name}`;
        for (const key in oldEffects) {
            if (Object.prototype.hasOwnProperty.call(oldEffects, key)) {
                const action = createAction(`${effectName}/${key}`);
                const innerReducer = (state, action) => {
                    try {
                        return commonReducerHandle(state, action.payload);
                    } catch (error) {
                        errorHandle(error);
                        return state;
                    }
                };
                actions[action.fulfilled] = innerReducer;

                const dispatch = {
                    fulfilled(obj) {
                        store.dispatch(action.fulfilled(obj));
                    },
                };

                /**
                 * action creaters
                 */
                newEffects[key] = (...args) => store.dispatch(action.pending(payloadEncode(...args)));

                /**
                 * run watcher
                 */
                runSaga(function*() {
                    const saga = getSaga(app, action, oldEffects[key], effectName, dispatch);
                    const task = yield fork(saga);
                    yield fork(function*() {
                        yield take(`${effectName}/${ActionTypes.CANCEL_EFFECTS}`);
                        yield cancel(task);
                    });
                });
            }
        }

        const newReducers = {};
        const oldReducers = model.reducers || {};
        for (const key in oldReducers) {
            if (Object.prototype.hasOwnProperty.call(oldReducers, key)) {
                actions[`${effectName}/${key}`] = (state, { payload }) => {
                    const that = {
                        state,
                    };
                    const particalState = oldReducers[key].call(that, ...payloadDecode(payload));
                    return commonReducerHandle(state, particalState);
                };
                newReducers[key] = (...args) => {
                    store.dispatch({
                        type: `${effectName}/${key}`,
                        payload: payloadEncode(...args),
                    });
                };
            }
        }

        const oldPureReducers = model.pureReducers || {};
        for (const key in oldPureReducers) {
            if (Object.prototype.hasOwnProperty.call(oldPureReducers, key)) {
                actions[key] = oldPureReducers[key];
            }
        }

        return {
            actions,
            actionCreaters: {
                ...newEffects,
                ...newReducers,
            },
        };
    }

    function checkModel(model, app, namespace = '') {
        invariant(
            typeof model.name === 'string' && model.name !== '',
            `name of model should be non empty string, but got ${typeof model.name}`,
        );

        if (namespace !== '') {
            invariant(
                app.models[`${namespace}/${model.name}`] == null,
                `namespace/name of model should be unique, please check model namespace/name: ${namespace}/${
                    model.name
                }`,
            );
            invariant(
                typeof app.store.matrixReducers[namespace] !== 'function',
                `namespace should be different of model name, please check namespace: ${namespace}`,
            );
        } else {
            invariant(
                app.models[model.name] == null,
                `name of model should be unique, please check model name: ${model.name}`,
            );

            invariant(
                app.store.matrixReducers[model.name] == null,
                `name of model should be different of exist model name or exist namespace, please check model name: ${
                    model.name
                }`,
            );
        }

        invariant(model.state != null, 'State in model should not be null or undefined.');
    }

    function mountModel(app, name, actionCreaters, getState, isRoot = false) {
        app.models[name] = {
            ...actionCreaters,
            name: name,
            [ROOT_MODEL]: isRoot,
        };

        Object.defineProperty(app.models[name], 'state', {
            enumerable: true,
            configurable: false,
            get: getState,
        });
    }

    /**
     * return reducer
     * @param {*} model
     */
    function registerCombineModel(combineModel, app, getState) {
        const { models = [], state } = combineModel;
        const rs = {};

        models.forEach(model => {
            checkModel(model, app);

            const getModelState = getStateDelegate(state, getState, model.name);

            if (model[COMBINED_RESA_MODEL]) {
                // @ts-ignore
                this.models[model.name] = Object.assign({}, model);
                rs[model.name] = registerCombineModel(model, app, getModelState);
                return;
            }

            const { actions, actionCreaters } = runSagaAndReturnActionCreators(model, app);

            rs[model.name] = handleActions(actions, cloneState(model.state));

            mountModel(app, model.name, actionCreaters, getModelState);
        });
        return combineReducersInner(rs, cloneState(state));
    }

    function registerModel(model) {
        // @ts-ignore
        const app = this;

        if (process.env.NODE_ENV !== 'production') {
            checkModel(model, app);
        }

        const store = app.store;

        const { name } = model;

        /**
         * use up level model to judge the shape of state
         */
        const getState = getStateDelegate(initialState, app.store.getState, name);

        if (model[COMBINED_RESA_MODEL]) {
            // @ts-ignore
            this.models[model.name] = Object.assign({}, model, {
                [ROOT_MODEL]: true,
            });
            const action = registerCombineModel(model, app, getState);
            store.asyncReducers[name] = action;
            store.replaceReducer(makeRootReducer(store.asyncReducers, store.matrixReducers));
            return;
        }

        const { actions, actionCreaters } = runSagaAndReturnActionCreators(model, app);

        /**
         * if you want to immutable state, pass Immutable.map() here.
         * clone state avoid bug when registerModel after unRegisterModel.
         */
        const state = cloneState(model.state);

        store.asyncReducers[name] = handleActions(actions, state);
        store.replaceReducer(makeRootReducer(store.asyncReducers, store.matrixReducers));

        mountModel(app, name, actionCreaters, getState, true);
    }

    /**
     * register for 4.0, support config namespace in subscribe
     * @param model
     */
    function register(model, newNamespace) {
        // @ts-ignore
        const app = this;
        const store = app.store;
        const name = model.name;
        const namespace = newNamespace || model.namespace;

        if (process.env.NODE_ENV !== 'production') {
            checkModel(model, app, namespace);
        }

        const { actions, actionCreaters } = runSagaAndReturnActionCreators(model, app, namespace);
        const state = cloneState(model.state);

        if (namespace === '') {
            const getState = getStateDelegate(initialState, app.store.getState, name);
            store.matrixReducers[name] = handleActions(actions, state);
            mountModel(app, name, actionCreaters, getState, true);
        } else {
            const namespaceReducer = store.matrixReducers[namespace] || {};
            store.matrixReducers[namespace] = namespaceReducer;
            namespaceReducer[name] = handleActions(actions, state);

            let getState = getStateDelegate(initialState, app.store.getState, namespace);
            getState = getStateDelegate({}, getState, name);
            mountModel(app, `${namespace}/${name}`, actionCreaters, getState, false);
        }

        store.replaceReducer(makeRootReducer(store.asyncReducers, store.matrixReducers));
    }

    function unReg(app, model) {
        if (app.models[model.name]) {
            app.store.dispatch({ type: `${model.name}/${ActionTypes.CANCEL_EFFECTS}` });
            delete app.models[model.name];
        }
    }

    /**
     * unregister model, including cancle saga, delete model, retain reducers
     * @param {*} model
     */
    function unRegisterModel(model, shoudCheckRoot = true) {
        invariant(
            typeof model.name === 'string' && model.name !== '',
            `name of model should be non empty string, but got ${typeof model.name}`,
        );
        // @ts-ignore
        const transformedModel = this.models[model.name];
        invariant(transformedModel != null, 'should not unRegister unRegistered model');

        if (shoudCheckRoot) {
            invariant(transformedModel[ROOT_MODEL], 'should only unRegister root model');
        }

        if (transformedModel[COMBINED_RESA_MODEL]) {
            const { models = [] } = transformedModel;
            // @ts-ignore
            delete this.models[transformedModel.name];

            models.forEach(m => {
                // @ts-ignore
                this.unRegisterModel(m, false);
            });
        } else {
            // @ts-ignore
            unReg(this, transformedModel);
        }
    }

    const app: any = {
        /**
         * redux store
         */
        store: null,
        /**
         * redux-saga middleware.run
         */
        runSaga: null,
        /**
         * model list
         */
        models: {},
        /**
         * model to model type
         */
        modelTypeName: {},
        /**
         * register a model
         */
        registerModel,
        /**
         * unRegister a model
         */
        unRegisterModel,
    };

    const sagaMiddleware = createSagaMiddleware();

    /**
     * init middlewares, compose redux-dev-tools
     */
    let finalMiddlewares: any = middlewares.concat(sagaMiddleware, reduxSagaMiddleware);

    if (process.env.NODE_ENV !== 'production') {
        // @ts-ignore
        if (window.__REDUX_DEVTOOLS_EXTENSION__) {
            // redux dev tool extension for chrome
            finalMiddlewares = compose(
                applyMiddleware(...finalMiddlewares),
                // @ts-ignore
                window.__REDUX_DEVTOOLS_EXTENSION__(reduxDevToolOptions),
            );
        } else {
            if (remoteReduxDevtools) {
                // remote redux dev tool
                const composeWithDevTools = require('remote-redux-devtools').composeWithDevTools;
                const composeEnhancers = composeWithDevTools(reduxDevToolOptions);
                finalMiddlewares = composeEnhancers(applyMiddleware(...finalMiddlewares));
            } else {
                finalMiddlewares = applyMiddleware(...finalMiddlewares);
            }
        }
    } else {
        finalMiddlewares = applyMiddleware(...finalMiddlewares);
    }

    app.store = createStore(makeRootReducer({}, {}), initialState, finalMiddlewares);
    app.store.asyncReducers = {};
    app.store.matrixReducers = {};

    app.register = register.bind(app);
    app.registerModel = registerModel.bind(app);
    app.unRegisterModel = unRegisterModel.bind(app);
    app.runSaga = sagaMiddleware.run;

    return app;
}
