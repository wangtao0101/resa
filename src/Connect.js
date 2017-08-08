import React from 'react';
import { connect as reactReduxConnect } from 'react-redux';
import hoistNonReactStatic from 'hoist-non-react-statics';
import invariant from 'invariant';
import { storeShape, subscriptionShape, resaShape } from './Provider';

export default function createConnect(isConnectModel = false) {
    return (mapStateToProps, mapDispatchToProps, mergeProps, extraOptions = {}) => {
        const storeKey = extraOptions.storeKey || 'store';
        const resaKey = `${storeKey}Resa`;
        const subscriptionKey = `${storeKey}Subscription`;

        const contextTypes = {
            [storeKey]: storeShape.isRequired,
            [subscriptionKey]: subscriptionShape,
            [resaKey]: resaShape.isRequired,
        };

        return function wrapWithConnect(WrappedComponent) {
            class Connect extends React.Component {
                constructor(props, context) {
                    super(props, context);
                    this.resa = context[resaKey];
                    this.wrappedInstance = null;

                    this.setWappedInstance = this.setWappedInstance.bind(this);
                    this.getWrappedInstance = this.getWrappedInstance.bind(this);

                    const newMapStateToProps = (() => {
                        if (mapStateToProps == null) {
                            return null;
                        }
                        return (state, ownProps) => mapStateToProps(this.resa.models, state, ownProps);
                    })();
                    const newMapDispatchToProps = (() => {
                        if (mapDispatchToProps == null) {
                            return null;
                        }
                        if (isConnectModel) {
                            invariant(Array.isArray(mapDispatchToProps),
                                "The second args of connectModel should be an array of model's namespace!");
                            const models = {};
                            mapDispatchToProps.forEach((namespace) => {
                                const model = this.resa.models[namespace];
                                models[namespace] = Object.assign({}, {
                                    effects: model.effects,
                                    reducers: model.reducers,
                                });
                            });
                            return () => models;
                        }
                        return dispatch => mapDispatchToProps(this.resa.models, dispatch);
                    })();
                    this.ConnectedComponent = reactReduxConnect(
                        newMapStateToProps,
                        newMapDispatchToProps,
                        mergeProps,
                        extraOptions)(WrappedComponent);
                }

                getChildContext() {
                    return {
                        [storeKey]: this.context[storeKey],
                        [subscriptionKey]: this.context[subscriptionKey],
                        [resaKey]: this.context[resaKey],
                    };
                }

                getWrappedInstance() {
                    return this.wrappedInstance.getWrappedInstance();
                }

                setWappedInstance(ref) {
                    this.wrappedInstance = ref;
                }

                render() {
                    const ConnectedComponent = this.ConnectedComponent;
                    return <ConnectedComponent {...this.props} ref={this.setWappedInstance} />;
                }
            }

            Connect.WrappedComponent = WrappedComponent;

            const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
            Connect.displayName = `ResaConnect(${wrappedComponentName})`;
            Connect.childContextTypes = contextTypes;
            Connect.contextTypes = contextTypes;
            return hoistNonReactStatic(Connect, WrappedComponent);
        };
    };
}
