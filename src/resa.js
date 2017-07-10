import { applyMiddleware, createStore, combineReducers } from 'redux';
import createSagaMiddleware, { takeEvery } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { createAction, handleActions } from './action';

export default function createResa(options = {}) {
    const {
        defaultHistory = null, // eslint-disable-line
        reducers = [],
        middlewares = [],
        initialState = {},
    } = options;

    function emptyReducer(state = {}, _action) {
        return state;
    }

    function makeRootReducer(asyncReducers) {
        return combineReducers({
            ...reducers.concat(emptyReducer),
            ...asyncReducers,
        });
    }

    function getEffectSaga(app, saga, namespace, dispatch) {
        return function* (action) { // eslint-disable-line
            try {
                yield call([app.model[namespace], saga], action, dispatch);
            } catch (error) {
                console.error(error); // eslint-disable-line
            }
        };
    }

    function getSaga(app, action, effect, model, dispatch) {
        return function* () {
            yield takeEvery(
                action.pending,
                getEffectSaga(app, effect, model.namespace, dispatch)
            );
        };
    }

    function registerModel(model) {
        const app = this;
        const newEffect = {};
        const actions = {};
        for (const key in model.effects) { // eslint-disable-line
            if (Object.prototype.hasOwnProperty.call(model.effects, key)) {
                const action = createAction(key);
                actions[action.pending] = (state, action) => { // eslint-disable-line
                    return Object.assign(state, action.payload, { loading: true });
                };
                actions[action.fulfilled] = (state, action) => { // eslint-disable-line
                    return Object.assign(state, action.payload, { loading: false });
                };
                actions[action.reject] = (state, action) => { // eslint-disable-line
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

                newEffect[key] = function* (obj) { // eslint-disable-line
                    yield call(
                        getEffectSaga(app, effect, model, dispatch),
                        action.pending(obj)
                    );
                };

                this.runSaga(getSaga(app, action, effect, model, dispatch));
            }
        }

        // 查找已有的reducer，如果存在相同reducer的模型，可以提出一个警告，并合并两个reducer到同一个reducer中
        this.store.asyncReducers[model.namespace] = handleActions(actions, {});

        // 替换原有的effects
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
        model: [],
        /**
         * register a model
         */
        registerModel,
    };

    const sagaMiddleware = createSagaMiddleware();

    app.store = createStore(
        makeRootReducer(),
        initialState,
        applyMiddleware(...middlewares.concat(sagaMiddleware))
    );
    app.store.asyncReducers = {};

    app.registerModel = registerModel.bind(app);
    app.runSaga = sagaMiddleware.run;

    return app;
}
