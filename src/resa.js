import { applyMiddleware, createStore, combineReducers, compose } from 'redux';
import { combineReducers as combineImmutableReducers } from 'redux-immutable';
import createSagaMiddleware from 'redux-saga';
import invariant from 'invariant';
import { call, fork, take, cancel, takeEvery, takeLatest, throttle } from 'redux-saga/effects';
import { reduxSagaMiddleware } from 'redux-saga-middleware';
import { createAction, handleActions } from './action';
import isImmutable from './predicates';
import { COMBINED_RESA_MODEL } from './combineModel';
import { cloneState, getStateDelegate } from './help';

const ActionTypes = {
    INIT: '@@redux/INIT',
    CANCEL_EFFECTS: '@@CANCEL_EFFECTS',
};

const noop = () => { };

const payloadEncode = (...args) => {
    const payload = {
        __resa__payload__: true,
    };
    args.forEach((item, i) => {
        payload[i] = item;
    });
    return payload;
};

const payloadDecode = (payload) => {
    if (payload.__resa__payload__) { // eslint-disable-line
        delete payload.__resa__payload__; // eslint-disable-line
        return Object.keys(payload).map(k => payload[k]);
    }
    return payload;
};

export default function createResa(options = {}) {
    const {
        reducers = {},
        errorHandle = noop,
    } = options;

    /**
     * init state
     */
    const initialState = options.initialState || {};

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

    function makeRootReducer(asyncReducers) {
        return combineReducersInner({
            ...initReducer,
            ...asyncReducers,
        }, initialState);
    }

    function mergeImmutablePayload(state, payload = {}) {
        return state.merge(payload);
    }

    function commonReducerHandle(state, payload) {
        if (payload == null) {
            return state;
        }
        if (isImmutable(state)) {
            return mergeImmutablePayload(state, payload);
        }
        if (Object.prototype.toString.call(state) === '[object Object]') {
            invariant(Object.prototype.toString.call(payload) === '[object Object]',
                'The payload must be an object if the shape of state is object');
            return Object.assign({}, state, payload);
        }
        return payload;
    }

    function getEffectSaga(models, saga, name, dispatch) {
        return function* (action) { // eslint-disable-line
            const { resolve, reject, ...rest } = action;
            try {
                const that = Object.assign({}, models[name], dispatch, { models });
                const result = yield call([that, saga], ...payloadDecode(rest.payload));
                resolve(result);
            } catch (error) {
                errorHandle(error);
                reject(error);
            }
        };
    }

    function getSaga(app, action, effect, model, dispatch) {
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
                        getEffectSaga(app.models, actualEffect, model.name, dispatch)
                    );
                };
            case 'throttle': // eslint-disable-line
                return function* () { // eslint-disable-line
                    yield throttle(
                        effect[2],
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.name, dispatch)
                    );
                };
            default: // eslint-disable-line
                return function* () { // eslint-disable-line
                    yield takeEvery(
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.name, dispatch)
                    );
                };
        }
    }

    function runSagaAndReturnActionCreators(model, app, unRegisterName) {
        const actions = {};
        const { store, runSaga } = app;

        const newEffects = {};
        const oldEffects = model.effects || {};
        for (const key in oldEffects) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(oldEffects, key)) {
                const action = createAction(`${model.name}/${key}`);
                const innerReducer = (state, action) => { // eslint-disable-line
                    try {
                        return commonReducerHandle(state, action.payload);
                    } catch (error) {
                        errorHandle(error);
                    }
                };
                actions[action.fulfilled] = innerReducer;
                actions[action.reject] = innerReducer;

                const dispatch = {
                    fulfilled(obj) {
                        store.dispatch(action.fulfilled(obj));
                    },
                    reject(obj) {
                        store.dispatch(action.reject(obj));
                    },
                };

                /**
                 * action creaters
                 */
                newEffects[key] = (...args) => store.dispatch(action.pending(payloadEncode(...args)));

                /**
                 * run watcher
                 */
                runSaga(function* () { // eslint-disable-line
                    const saga = getSaga(app, action, oldEffects[key], model, dispatch);
                    const task = yield fork(saga);
                    yield fork(function* () { // eslint-disable-line
                        yield take(`${unRegisterName}/${ActionTypes.CANCEL_EFFECTS}`);
                        yield cancel(task);
                    });
                });
            }
        }

        const newReducers = {};
        const oldReducers = model.reducers || {};
        for (const key in oldReducers) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(oldReducers, key)) {
                actions[`${model.name}/${key}`] = (state, { payload }) => {
                    const that = { state };
                    return oldReducers[key].call(that, ...payloadDecode(payload));
                };
                newReducers[key] = (...args) => {
                    store.dispatch({
                        type: `${model.name}/${key}`,
                        payload: payloadEncode(...args),
                    });
                };
            }
        }

        const oldPureReducers = model.pureReducers || {};
        for (const key in oldPureReducers) { // eslint-disable-line
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

    function checkModel(model, app) {
        invariant(typeof model.name === 'string' && model.name !== '',
            'name of model should be non empty string');

        if (app.models[model.name] != null) {
            // avoid register twice
            return false;
        }

        invariant(model.state != null, 'State in model should not be null or undefined.');

        return true;
    }

    function mountModel(app, model, actionCreaters, getState) {
        app.models[model.name] = { // eslint-disable-line
            ...actionCreaters,
            name: model.name,
        };

        Object.defineProperty(app.models[model.name], 'state', {
            enumerable: true,
            configurable: false,
            get: getState,
        });

        if (model.setup) {
            app.runSaga(function* () { // eslint-disable-line
                const task = yield fork([app.models[model.name], model.setup]);
                yield fork(function* () { // eslint-disable-line
                    yield take(`${name}/${ActionTypes.CANCEL_EFFECTS}`);
                    yield cancel(task);
                });
            });
        }
    }

    /**
     * return reducer
     * @param {*} model
     */
    function registerCombineModel(combineModel, app, getState) {
        const { models = [], state } = combineModel;

        const rs = {};
        models.forEach((model) => {
            if (!checkModel(model, app)) {
                return;
            }

            const getModelState = getStateDelegate(state, getState, model.name);

            if (model[COMBINED_RESA_MODEL]) {
                rs[model.name] = registerCombineModel(model, app, getModelState);
                return;
            }

            const { actions, actionCreaters } = runSagaAndReturnActionCreators(model, app);

            rs[model.name] = handleActions(actions, cloneState(model.state));

            mountModel(app, model, actionCreaters, getModelState);
        });
        return combineReducersInner(rs, cloneState(state));
    }

    function registerModel(model) {
        if (!checkModel(model, this)) {
            return;
        }

        const app = this;
        const store = this.store;

        const { name } = model;

        /**
         * use up level model to judge the shape of state
         */
        const getState = getStateDelegate(initialState, app.store.getState, name);

        if (model[COMBINED_RESA_MODEL]) {
            const action = registerCombineModel(model, app, getState);
            store.asyncReducers[name] = action;
            store.replaceReducer(makeRootReducer(store.asyncReducers));
            return;
        }

        const { actions, actionCreaters } = runSagaAndReturnActionCreators(model, app, name);

        /**
         * if you want to immutable state, pass Immutable.map() here.
         * clone state avoid bug when registerModel after unRegisterModel.
         */
        const state = cloneState(model.state);

        store.asyncReducers[name] = handleActions(actions, state);
        store.replaceReducer(makeRootReducer(store.asyncReducers));

        mountModel(app, model, actionCreaters, getState);
    }

    /**
     * unregister model, including delete reducer, delete asyncReducers ,cancle saga, delete model
     * @param {*} model
     */
    function unRegisterModel(name) {
        const store = this.store;

        const model = this.models[name];
        if (model == null) {
            return;
        }

        if (store.asyncReducers[name]) {
            delete store.asyncReducers[name];
            store.replaceReducer(makeRootReducer(store.asyncReducers));
        }
        delete this.models[name];
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
