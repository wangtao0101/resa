import React from 'react';
import { connect as reactReduxConnect } from 'react-redux';
import hoistNonReactStatic from 'hoist-non-react-statics';

const resaKey = 'resa';
const storeKey = 'store';
const subscriptionKey = `${storeKey}Subscription`;

export default function resaConnect(mapStateToProps, mapDispatchToProps, mergeProps, extraOptions) {
    return function wrapWithConnect(WrappedComponent) {
        class Connect extends React.Component {
            constructor(props, context) {
                super(props, context);
                this.resa = context[resaKey];
            }

            getChildContext() {
                return {
                    [storeKey]: this.context[storeKey],
                    [subscriptionKey]: this.context[subscriptionKey],
                    [resaKey]: this.context[resaKey],
                };
            }

            render() {
                return reactReduxConnect(
                    mapStateToProps,
                    mapDispatchToProps,
                    mergeProps,
                    extraOptions)(<WrappedComponent {...this.props} />);
            }
        }

        Connect.WrappedComponent = WrappedComponent;
        Connect.displayName = 'ResaConnect';
        return hoistNonReactStatic(Connect, WrappedComponent);
    };
}
