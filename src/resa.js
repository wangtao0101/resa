import { applyMiddleware, createStore, combineReducers, compose } from 'redux';
import { combineReducers as combineImmutableReducers } from 'redux-immutable';
import createSagaMiddleware from 'redux-saga';
import invariant from 'invariant';
import { call, put, takeEvery, takeLatest, throttle } from 'redux-saga/effects';
import { reduxSagaMiddleware } from 'redux-saga-middleware';
import { createAction, handleActions } from './action';

const ActionTypes = {
    INIT: '@@redux/INIT',
};

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
     * merge reduer in same state node
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

    function getEffectSaga(models, saga, namespace, dispatch) {
        return function* (action) { // eslint-disable-line
            try {
                yield call([models[namespace], saga], models, action, dispatch);
            } catch (error) {
                console.error(error); // eslint-disable-line
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
        case 'takeLatest':
                return function* () { // eslint-disable-line
                    yield takeLatest(
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.namespace, dispatch)
                    );
                };
        case 'throttle':
                return function* () { // eslint-disable-line
                    yield throttle(
                        effect[2],
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.namespace, dispatch)
                    );
                };
        default:
                return function* () { // eslint-disable-line
                    yield takeEvery(
                        action.pending,
                        getEffectSaga(app.models, actualEffect, model.namespace, dispatch)
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
        const newEffect = {};
        const actions = {};

        if (this.models[model.namespace] != null) {
            return;
        }

        for (const key in model.effects) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(model.effects, key)) {
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

                newEffect[key] = function (obj) { // eslint-disable-line
                    return store.dispatch(action.pending(obj));
                };
                this.runSaga(getSaga(app, action, model.effects[key], model, dispatch));
            }
        }

        // find reducer and merge reducer
        if (store.reducerList[model.reducer] == null) {
            store.reducerList[model.reducer] = [handleActions(actions, model.state || getEmptyObject())];
            store.asyncReducers[model.reducer] = store.reducerList[model.reducer][0];
        } else {
            store.reducerList[model.reducer].push(handleActions(actions, model.state || getEmptyObject()));
            store.asyncReducers[model.reducer] = composeHandleActions(store.reducerList[model.reducer]);
        }
        store.replaceReducer(makeRootReducer(store.asyncReducers));

        // replace original effects
        this.models[model.namespace] = Object.assign({}, model, { effects: newEffect });

        this.models[model.namespace].getState = () => {
            if (!immutable) {
                return app.store.getState()[model.reducer];
            }
            return app.store.getState().get(model.reducer);
        };
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
    app.runSaga = sagaMiddleware.run;

    return app;
}
