import clone from 'clone';
import isImmutable from './predicates';

export function cloneState(state) { // eslint-disable-line
    if (isImmutable(state)) {
        return state;
    }
    return clone(state);
}

export function getStateDelegate(state, getState, name) {
    return () => {
        if (!isImmutable(state)) {
            return getState()[name];
        }
        return getState().get(name);
    };
}
