import { applyMiddleware, createStore, combineReducers } from 'redux';
import createSagaMiddleware, { takeEvery } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { createAction, handleActions } from './action';

export default function createResa(options) {
    const {
        defaultHistory, // eslint-disable-line
        reducers = [],
        middlewares = [],
        initialState,
    } = options;

    function makeRootReducer(asyncReducers) {
        return combineReducers({
            ...reducers,
            ...asyncReducers,
        });
    }

    function getEffectSaga(sagax, model, dispatch) {
        return function* (action) { // eslint-disable-line
            try {
                yield call([model, sagax], action, dispatch);
            } catch (error) {
                console.error(error); // eslint-disable-line
            }
        };
    }

    function* getSaga(action, effect, app, dispatch) {
        yield takeEvery(action.pending, getEffectSaga(effect, app, dispatch));
    }

    function registerModel(model) {
        const newEffect = {};
        const actions = {};
        for (const key in app.effects) { // eslint-disable-line
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
                    yield call(getEffectSaga(effect, model, dispatch), action.pending(obj));
                };

                this.store.sagaMiddleware.run(getSaga(action, effect, model, dispatch));
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
         * redux-saga middleware
         */
        sagaMiddleware: null,
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

    return app;
}
