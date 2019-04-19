import * as React from 'react';
import { connect as reactReduxConnect } from 'react-redux';
import { ResaContext } from './Context';
import { forwardComponent } from '../utils/help';

interface ExtraOptions {
    forwardRef?: any;
    context?: any;
}

export default function createConnect() {
    return (mapStateToProps, mapDispatchToProps, mergeProps = null, extraOptions: ExtraOptions = {}) => {
        const reactReduxExtraOptions = {
            context: ResaContext,
            ...extraOptions,
        };

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
                    return reactReduxConnect(
                        newMapStateToProps,
                        newMapDispatchToProps,
                        mergeProps,
                        reactReduxExtraOptions,
                    )(WrappedComponent);
                }, [reactReduxExtraOptions.forwardRef, reactReduxExtraOptions.context, mergeProps]);

                const { forwardedRef, ...rest } = props;

                return <ConnectedComponent {...rest} ref={forwardedRef} />;
            }

            return forwardComponent(extraOptions.forwardRef, ConnectFunction, WrappedComponent, 'ResaConnect');
        };
    };
}
