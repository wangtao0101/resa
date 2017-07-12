import React from 'react';
import { connect as reactReduxConnect } from 'react-redux';
import hoistNonReactStatic from 'hoist-non-react-statics';
import { storeShape, subscriptionShape, resaShape } from './Provider';

const resaKey = 'resa';
const storeKey = 'store';
const subscriptionKey = `${storeKey}Subscription`;

const contextTypes = {
    [storeKey]: storeShape.isRequired,
    [subscriptionKey]: subscriptionShape,
    [resaKey]: resaShape.isRequired,
};

export default function resaConnect(mapStateToProps, mapDispatchToProps, mergeProps, extraOptions) {
    return function wrapWithConnect(WrappedComponent) {
        class Connect extends React.Component {
            constructor(props, context) {
                super(props, context);
                this.resa = context[resaKey];
                this.wrappedInstance = WrappedComponent;
            }

            getChildContext() {
                return {
                    [storeKey]: this.context[storeKey],
                    [subscriptionKey]: this.context[subscriptionKey],
                    [resaKey]: this.context[resaKey],
                };
            }

            render() {
                const newMapStateToProps = (() => {
                    if (mapStateToProps == null) {
                        return null;
                    }
                    return args => mapStateToProps(this.resa, args);
                })();
                const newMapDispatchToProps = (() => {
                    if (mapDispatchToProps == null) {
                        return null;
                    }
                    return dispatch => mapDispatchToProps(this.resa, dispatch);
                })();
                const ConnectedComponent = reactReduxConnect(
                    newMapStateToProps,
                    newMapDispatchToProps,
                    mergeProps,
                    extraOptions)(WrappedComponent);
                return <ConnectedComponent {...this.props} />;
            }
        }

        Connect.WrappedComponent = WrappedComponent;

        const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
        Connect.displayName = `ResaConnect(${wrappedComponentName})`;
        Connect.childContextTypes = contextTypes;
        Connect.contextTypes = contextTypes;
        return hoistNonReactStatic(Connect, WrappedComponent);
    };
}
