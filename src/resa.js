import { applyMiddleware, createStore, combineReducers, compose } from 'redux';
import { combineReducers as combineImmutableReducers } from 'redux-immutable';
import createSagaMiddleware from 'redux-saga';
import invariant from 'invariant';
import { call, put, fork, take, cancel, takeEvery, takeLatest, throttle } from 'redux-saga/effects';
import { reduxSagaMiddleware } from 'redux-saga-middleware';
import { createAction, handleActions } from './action';

const ActionTypes = {
    INIT: '@@redux/INIT',
    CANCEL_EFFECTS: '@@CANCEL_EFFECTS',
};

const noop = () => {};

export default function createResa(options = {}) {
    const {
        reducers = {},
        /**
         * facebook immutable object, if null, we use plain redux state
         */
        immutable = null,
    } = options;

    function getEmptyObject() {
        if (immutable) {
            return immutable.Map();
        }
        return {};
    }

    function resaReducer(state = {}, _action) {
        return state;
    }

    const initReducer = {
        ...reducers,
        resaReducer,
    };

    function makeRootReducer(asyncReducers) {
        if (!immutable) {
            return combineReducers({
                ...initReducer,
                ...asyncReducers,
            });
        }
        return combineImmutableReducers({
            ...initReducer,
            ...asyncReducers,
        });
    }

    /**
     * merge reduer in same state node, state must hava been initialized in here
     * @param reducers
     */
    function composeHandleActions(reducerList = [], defaultState) {
        const reducer = (state, action) => {
            /**
             * handle ActionTypes.INIT action
             */
            if (action.type === ActionTypes.INIT) {
                if (immutable) {
                    return state.merge(defaultState);
                }
                return Object.assign({}, state, defaultState);
            }
            const getState = (previous, current) => current(previous, action);
            return reducerList.reduce(getState, state);
        };
        return reducer;
    }

    function mergeReducer(reducerMap) {
        const reducerList = [];
        for (const key in reducerMap) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(reducerMap, key)) {
                reducerList.push(reducerMap[key]);
            }
        }
        if (reducerList.length === 0) {
            return null;
        }
        if (reducerList.length === 1) {
            return reducerList[0];
        }
        return composeHandleActions(reducerList);
    }

    function getEffectSaga(models, saga, namespace, dispatch, errorHandle = noop) {
        return function* (action) { // eslint-disable-line
            const { resolve, reject, ...rest } = action;
            try {
                const result = yield call([models[namespace], saga], models, rest, dispatch);
                resolve(result);
            } catch (error) {
                errorHandle(error);
                reject(error);
            }
        };
    }

    function getSaga(app, action, effect, model, dispatch, errorHandle) {
        let type = 'takeEvery';
        let actualEffect = effect;
        if (Array.isArray(effect)) {
            type = effect[1];
            actualEffect = effect[0];

            invariant(
                ['takeEvery', 'takeLatest', 'throttle'].indexOf(type) > -1,
                'effect type should be takeEvery, takeLatest or throttle.'
            );

            if (type === 'throttle') {
                invariant(
                    Number.isInteger(effect[2]) === true && effect[2] > 0,
                    'ms of throttle should be positive integer.'
                );
            }
        }

        switch (type) {
            case 'takeLatest': // eslint-disable-line
                return function* () { // eslint-disable-line
                    yield takeLatest(
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.namespace, dispatch, errorHandle)
                    );
                };
            case 'throttle': // eslint-disable-line
                return function* () { // eslint-disable-line
                    yield throttle(
                        effect[2],
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.namespace, dispatch, errorHandle)
                    );
                };
            default: // eslint-disable-line
                return function* () { // eslint-disable-line
                    yield takeEvery(
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.namespace, dispatch, errorHandle)
                    );
                };
        }
    }

    function mergeImmutablePayload(state, payload = {}, loading) {
        let newState = state;
        newState = newState.set('loading', loading);
        for (const name in payload) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(payload, name)) {
                newState = newState.set(name, payload[name]);
            }
        }
        return newState;
    }

    function registerModel(model) {
        const app = this;
        const store = this.store;
        const actions = {};

        if (this.models[model.namespace] != null) {
            return;
        }

        const newEffects = {};
        const oldEffects = model.effects || {};
        for (const key in oldEffects) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(oldEffects, key)) {
                const action = createAction(`${model.namespace}/${key}`);
                actions[action.pending] = (state, action) => { // eslint-disable-line
                    if (immutable) {
                        return mergeImmutablePayload(state, {}, true);
                    }
                    return Object.assign({}, state, { loading: true });
                };
                actions[action.fulfilled] = (state, action) => { // eslint-disable-line
                    if (immutable) {
                        return mergeImmutablePayload(state, action.payload, false);
                    }
                    return Object.assign(state, action.payload, { loading: false });
                };
                actions[action.reject] = (state, action) => { // eslint-disable-line
                    if (immutable) {
                        return mergeImmutablePayload(state, action.payload, false);
                    }
                    return Object.assign(state, action.payload, { loading: false });
                };

                const dispatch = {
                    * fulfilled(obj) {
                        yield put(action.fulfilled(obj));
                    },
                    * reject(obj) {
                        yield put(action.reject(obj));
                    },
                };

                /**
                 * action creaters
                 */
                newEffects[key] = obj => store.dispatch(action.pending(obj));

                /**
                 * run watcher
                 */
                this.runSaga(function* () { // eslint-disable-line
                    const saga = getSaga(app, action, oldEffects[key], model, dispatch, options.errorHandle);
                    const task = yield fork(saga);
                    yield fork(function* () { // eslint-disable-line
                        yield take(`${model.namespace}/${ActionTypes.CANCEL_EFFECTS}`);
                        yield cancel(task);
                    });
                });
            }
        }

        const newReducers = {};
        const oldReducers = model.reducers || {};
        for (const key in oldReducers) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(oldReducers, key)) {
                actions[`${model.namespace}/${key}`] = oldReducers[key];
                newReducers[key] = (obj) => {
                    store.dispatch({
                        type: `${model.namespace}/${key}`,
                        payload: obj,
                    });
                };
            }
        }

        // find reducer and merge reducer
        if (store.reducerList[model.reducerName] == null) {
            store.reducerList[model.reducerName] = {};
            store.reducerList[model.reducerName][model.namespace] =
                handleActions(actions, model.state || getEmptyObject());
        } else {
            store.reducerList[model.reducerName][model.namespace] =
                handleActions(actions, model.state || getEmptyObject());
        }
        store.asyncReducers[model.reducerName] = mergeReducer(store.reducerList[model.reducerName]);
        store.replaceReducer(makeRootReducer(store.asyncReducers));

        // replace original effects and reducers with action creaters
        this.models[model.namespace] = Object.assign({}, model, { effects: newEffects, reducers: newReducers });

        this.models[model.namespace].getState = () => {
            if (!immutable) {
                return app.store.getState()[model.reducerName];
            }
            return app.store.getState().get(model.reducerName);
        };

        if (model.setup) {
            this.runSaga(function* () { // eslint-disable-line
                const task = yield fork([app.models[model.namespace], model.setup]);
                yield fork(function* () { // eslint-disable-line
                    yield take(`${model.namespace}/${ActionTypes.CANCEL_EFFECTS}`);
                    yield cancel(task);
                });
            });
        }
    }

    /**
     * unregister model, including delete reducer, delete asyncReducers ,cancle saga, delete model
     * @param {*} model
     */
    function unRegisterModel(model) {
        const store = this.store;

        store.dispatch({ type: `${model.namespace}/${ActionTypes.CANCEL_EFFECTS}` });
        if (store.reducerList[model.reducerName] && store.reducerList[model.reducerName][model.namespace]) {
            delete store.reducerList[model.reducerName][model.namespace];
            const mergedReducer = mergeReducer(store.reducerList[model.reducerName]);
            if (mergedReducer) {
                store.asyncReducers[model.reducerName] = mergedReducer;
                store.replaceReducer(makeRootReducer(store.asyncReducers));
            } else {
                delete store.asyncReducers[model.reducerName];
                store.replaceReducer(makeRootReducer(store.asyncReducers));
            }
        }

        delete this.models[model.namespace];
    }

    const app = {
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
         * register a model
         */
        registerModel,
        /**
         * unRegister a model
         */
        unRegisterModel,
    };

    /**
     * init state
     */
    const initialState = options.initialState || getEmptyObject();

    const sagaMiddleware = createSagaMiddleware();

    /**
     * init middlewares, compose redux-dev-tools
     */
    let middlewares = (options.middlewares || []).concat(sagaMiddleware, reduxSagaMiddleware);

    if (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION__) { // eslint-disable-line
        middlewares = compose(
            applyMiddleware(...middlewares),
            window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__({ // eslint-disable-line
                // if set to false, will not recompute the states on hot reloading (or on replacing the reducers).
                shouldHotReload: false,
            }) // redux dev tool extension for chrome
        );
    } else {
        middlewares = applyMiddleware(...middlewares);
    }

    app.store = createStore(
        makeRootReducer(),
        initialState,
        middlewares
    );
    app.store.asyncReducers = {};
    app.store.reducerList = {};

    app.registerModel = registerModel.bind(app);
    app.unRegisterModel = unRegisterModel.bind(app);
    app.runSaga = sagaMiddleware.run;

    return app;
}
