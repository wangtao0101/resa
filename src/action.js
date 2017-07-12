import { createAction as cAction } from 'redux-actions';

const PENDING = '_PENDING';
const FULFILLED = '_FULFILLED';
const REJECTED = '_REJECTED';

/**
 * create action
 * @param type
 * @param payloadCreator
 * @param metaCreator
 */
function createActionInner(type, payloadCreator, metaCreator) {
    return {
        pending: cAction(type + PENDING, payloadCreator, metaCreator),
        fulfilled: cAction(type + FULFILLED, payloadCreator, metaCreator),
        reject: cAction(type + REJECTED, payloadCreator, metaCreator),
    };
}

const actionMeta = '@redux-saga-action';
export function createAction(type, payloadCreator) {
    return createActionInner(type, payloadCreator, () => actionMeta);
}

export function handleActions(reducerMap, defaultState, _actions = {}) {
    const reducer = (state = defaultState, action) => {
        if (typeof reducerMap[action.type] === 'function') {
            return reducerMap[action.type](state, action);
        }
        return state;
    };
    return reducer;
}
