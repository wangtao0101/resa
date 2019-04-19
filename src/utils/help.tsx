import * as clone from 'clone';
import * as React from 'react';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import isImmutable from './predicates';

export function cloneState(state) {
    // eslint-disable-line
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

export function forwardComponent(forwardRef, Component, WrappedComponent, name) {
    // @ts-ignore
    Component.WrappedComponent = WrappedComponent;
    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const displayName = `${name}(${wrappedComponentName})`;
    // @ts-ignore
    Component.displayName = displayName;

    if (forwardRef) {
        const forwarded: any = React.forwardRef(function(props, ref) {
            return <Component {...props} forwardedRef={ref} />;
        });

        forwarded.displayName = displayName;
        forwarded.WrappedComponent = WrappedComponent;
        return hoistNonReactStatic(forwarded, WrappedComponent);
    }

    return hoistNonReactStatic(Component, WrappedComponent);
}
