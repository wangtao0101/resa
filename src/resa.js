import { applyMiddleware, createStore, combineReducers, compose } from 'redux';
import { combineReducers as combineImmutableReducers } from 'redux-immutable';
import createSagaMiddleware from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import { reduxSagaMiddleware } from 'redux-saga-middleware';
import { createAction, handleActions } from './action';

const window = window || {}; // eslint-disable-line

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
            ...reducers.concat(resaReducer),
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

    function getEffectSaga(app, saga, namespace, dispatch) {
        return function* (action) { // eslint-disable-line
            try {
                yield call([app.model[namespace], saga], app, action, dispatch);
            } catch (error) {
                console.error(error); // eslint-disable-line
            }
        };
    }

    function getSaga(app, action, effect, model, dispatch) {
        return function* () { // eslint-disable-line
            yield takeEvery(
                action.pending,
                getEffectSaga(app, effect, model.namespace, dispatch)
            );
        };
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

        if (this.model[model.namespace] == null) {
            return;
        }

        for (const key in model.effects) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(model.effects, key)) {
                const action = createAction(key);
                actions[action.pending] = (state, action) => { // eslint-disable-line
                    if (immutable) {
                        return mergeImmutablePayload(state, action.payload, true);
                    }
                    return Object.assign(state, action.payload, { loading: true });
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

                const effect = model.effects[key];

                newEffect[key] = function (obj) { // eslint-disable-line
                    store.dispatch(action.pending(obj));
                };

                this.runSaga(getSaga(app, action, effect, model, dispatch));
            }
        }

        // find reducer and merge reducer
        if (store.reducerList[model.reducer] == null) {
            store.asyncReducers[model.reducer] = handleActions(actions, model.state || getEmptyObject());
        } else {
            store.reducerList[model.reducer].push(handleActions(actions, model.state || getEmptyObject()));
            store.asyncReducers[model.reducer] = composeHandleActions(store.reducerList[model.reducer]);
        }
        store.replaceReducer(makeRootReducer(store.asyncReducers));

        // replace original effects
        this.model[model.namespace] = Object.assign({}, model, { effects: newEffect });
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
        model: {},
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
