import * as React from 'react';
import { connect as reactReduxConnect } from 'react-redux';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import { ResaContext } from './Context';

interface ExtraOptions {
    forwardRef?: any;
    context?: any;
}

export default function createConnect() {
    return (
        mapStateToProps,
        mapDispatchToProps,
        mergeProps = null,
        extraOptions: ExtraOptions,
    ) => {
        const reactReduxExtraOptions = {
            context: ResaContext,
            ...extraOptions,
        }

        return function wrapWithConnect(WrappedComponent) {
            function ConnectFunction(props) {
                const Context = reactReduxExtraOptions.context;

                const contextValue: any = React.useContext(Context);
                const resa = contextValue.store.resa;

                const newMapStateToProps = React.useMemo(() => {
                    if (mapStateToProps == null) {
                        return null;
                    }
                    return (state, ownProps) => mapStateToProps(resa.models, state, ownProps);
                }, []);

                const newMapDispatchToProps = React.useMemo(() => {
                    if (mapDispatchToProps == null) {
                        return null;
                    }
                    if (Array.isArray(mapDispatchToProps)) {
                        const models = {};
                        mapDispatchToProps.forEach(namespace => {
                            const model = resa.models[namespace];
                            models[namespace] = model;
                        });
                        return () => models;
                    }
                    return dispatch => mapDispatchToProps(resa.models, dispatch);
                }, []);

                const ConnectedComponent = React.useMemo(() => {
                    return reactReduxConnect(newMapStateToProps, newMapDispatchToProps, mergeProps, reactReduxExtraOptions)(
                        WrappedComponent,
                    );
                }, []);

                return <ConnectedComponent {...props} />;
            }

            ConnectFunction.WrappedComponent = WrappedComponent;
            const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
            const displayName = `ResaConnect(${wrappedComponentName})`
            ConnectFunction.displayName = displayName;

            if (reactReduxExtraOptions.forwardRef) {
                const forwarded: any = React.forwardRef(function forwardConnectRef(props, ref) {
                    return <ConnectFunction {...props} forwardedRef={ref} />;
                });

                forwarded.displayName = displayName;
                forwarded.WrappedComponent = WrappedComponent;
                return hoistNonReactStatic(forwarded, WrappedComponent);
            }

            return hoistNonReactStatic(ConnectFunction, WrappedComponent);
        };
    };
}
