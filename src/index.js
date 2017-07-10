
import createSagaMiddleware, { takeEvery } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import 'babel-polyfill';
import { createAction, handleActions } from './action';
import createResa from './resa';


// const sagaMiddleware = createSagaMiddleware();
// const middlewares = [sagaMiddleware];

// function reducer(state = {}, _action) {
//     return state;
// }

// const store = createStore(
//     reducer,
//     applyMiddleware(...middlewares)
// );

// store.asyncReducers = {};

// const makeRootReducer = asyncReducers => combineReducers({
//     // reducer,
//     ...asyncReducers,
// });

// const injectReducer = (key, red) => {
//     store.asyncReducers[key] = red;
//     store.replaceReducer(makeRootReducer(store.asyncReducers));
// };

// 提供一个方法，包装一下effects，这样其他地方可以拿到export app, 考虑更好的方式:
// 1. 提供一个辅助dispatch的函数 dispatch(help(app, app.effects.add, {}))
// 2. 提供一个mapDispatchToProps 包装函数
// 以上两种方法考虑都提供
// 最佳思路 提供一个Provider， 提供一个connect 包装 redux-connect 的 Provider 和 connect
// Provider 比较简单，提供一个app的context即可
// connect 包装 redux-connect的connect，首先拿到mapToProp 和mapToState， 包装处理后送给 redux-connect的connect
// 包装组件参考 react-router的withRouter组件
// https://github.com/ReactTraining/react-router/blob/v3.0.5/modules/withRouter.js
const model = {
    namespace: '_',
    reducer: 'xxx',
    effects: {
        * add(action, { fulfilled, reject }) {
            console.log(action);
            yield call(fulfilled, { a: 'a' });
            // yield call(reject, { b: 'b' });
            yield call(this.effects.minus, { c: ' c ' });
        },
        * minus(action, { fulfilled, reject }) {
            console.log(action);
            yield call(fulfilled, { d: 'd' });
        },
    },
};

// function getSaga(sagax, model, dispatch) {
//     return function* (action) { // eslint-disable-line
//         try {
//             yield call([model, sagax], action, dispatch);
//         } catch (error) {
//             console.error(error); // eslint-disable-line
//         }
//     };
// }

// function* saga() {
//     const newEffect = {};
//     const actions = {};
//     for (const key in app.effects) { // eslint-disable-line
//         if (Object.prototype.hasOwnProperty.call(app.effects, key)) {
//             const a = createAction(key);
//             actions[a.pending] = (state, action) => { // eslint-disable-line
//                 console.log(state);
//                 console.log(action);
//                 return Object.assign(state, action.payload, { loading: true });
//             };
//             actions[a.fulfilled] = (state, action) => { // eslint-disable-line
//                 console.log(state);
//                 console.log(action);
//                 return Object.assign(state, action.payload, { loading: false });
//             };
//             actions[a.reject] = (state, action) => { // eslint-disable-line
//                 console.log(state);
//                 console.log(action);
//                 return Object.assign(state, action.payload, { loading: false });
//             };

//             const dispatch = {
//                 * fulfilled(obj) {
//                     yield put(a.fulfilled(obj));
//                 },
//                 * reject(obj) {
//                     yield put(a.reject(obj));
//                 },
//             };

//             const effect = app.effects[key];

//             newEffect[key] = function* (obj) { // eslint-disable-line
//                 yield call(getSaga(effect, app, dispatch), a.pending(obj));
//             };

//             yield takeEvery(a.pending, getSaga(effect, app, dispatch));
//         }
//     }

//     // 查找已有的reducer，如果存在相同reducer的模型，可以提出一个警告，并合并两个reducer到同一个reducer中
//     injectReducer(app.namespace, handleActions(actions, {}));

//     app.effects = Object.assign(app.effects, newEffect);
// }

// sagaMiddleware.run(saga);

const app = createResa();

app.registerModel(model);

app.store.dispatch(createAction('add').pending());

/**
 * 组合同一state下的reducer， 使他们仍然在同一state下
 * @param reducers
 */
// export function composeHandleActions(reducers: Array<any>) {
//     const getDefaultState = (previous, current) => {
//         return previous.mergeDeep(current(undefined, { type: '@init@init' }));
//     };
//     const defaultState = reducers.reduce(getDefaultState, Immutable.Map());
//     const reducer = (state = defaultState, action) => {
//         const getState = (previous, current) => {
//             return current(previous, action);
//         };
//         return reducers.reduce(getState, state);
//     };
//     return reducer;
// }

// 提供一个 vscode插件帮助autoComplete, 可能需要使用 babylon 和 typescript 的 parse, 但是估计d.ts应该就可以搞定此问题
