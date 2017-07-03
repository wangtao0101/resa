import { createAction as cAction } from 'redux-actions';

const PENDING = '_PENDING';
const FULFILLED = '_FULFILLED';
const REJECTED = '_REJECTED';

/**
 * 创建action，自动创建三个action，pending开始action，fulfilled完成action，rejected失败actoin
 * @param type
 * @param payloadCreator
 * @param metaCreator
 */
export function createAction(type, payloadCreator, metaCreator) {
    return {
        pending: cAction(type + PENDING, payloadCreator, metaCreator),
        fulfilled: cAction(type + FULFILLED, payloadCreator, metaCreator),
        reject: cAction(type + REJECTED, payloadCreator, metaCreator),
    };
}

// 创建具有action.resolve 和 action.reject 属性的action, 使用redux-saga-middleware
// const actionMeta = '@redux-saga-action';
// export function createSyncAction(type, payloadCreator?) {
//     return createAction(type, payloadCreator, () => actionMeta);
// }

/**
 * 为所有action自动绑定loading标识
 * @param reducerMap
 * @param actionName
 * @param loading
 */
// const addLoadingReducer = (reducerMap, actionName, loading) => {
//     const func = reducerMap[actionName];
//     if (typeof reducerMap[actionName] === 'function') {
//         reducerMap[actionName] = (state, action) => {
//             return func(state, action).set('loading', loading);
//         };
//     } else {
//         reducerMap[actionName] = (state, action) => {
//             return state.set('loading', loading);
//         };
//     }
// };

export function handleActions(reducerMap, defaultState, _actions = {}) {
    // Object.keys(actions).forEach((key) => {
    //     const action = actions[key];
    //     addLoadingReducer(reducerMap, action.toString(), true);
    //     addLoadingReducer(reducerMap, action.fulfilled.toString(), false);
    //     addLoadingReducer(reducerMap, action.rejected.toString(), false);
    // });
    const reducer = (state = defaultState, action) => {
        if (typeof reducerMap[action.type] === 'function') {
            return reducerMap[action.type](state, action);
        }
        return state;
    };
    return reducer;
}

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
