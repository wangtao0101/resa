import React from 'react';
import { connect as reactReduxConnect } from 'react-redux';
import hoistNonReactStatic from 'hoist-non-react-statics';
import { storeShape, subscriptionShape, resaShape } from './Provider';

export default function createConnect() {
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
                        if (Array.isArray(mapDispatchToProps)) {
                            const models = {};
                            mapDispatchToProps.forEach((namespace) => {
                                const model = this.resa.models[namespace];
                                models[namespace] = model;
                            });
                            return () => models;
                        }
                        return dispatch => mapDispatchToProps(this.resa.models, dispatch);
                    })();

                    // add withRef for all use case, user can use React.createRef() to get ref
                    extraOptions.withRef = true; // eslint-disable-line
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

                setWappedInstance(ref) {
                    if (this.props.forwardedRef) { // eslint-disable-line
                        this.props.forwardedRef.current = ref.getWrappedInstance(); // eslint-disable-line
                    }
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
            const TargetComponent = hoistNonReactStatic(Connect, WrappedComponent);

            return React.forwardRef((props, ref) => <TargetComponent {...props} forwardedRef={ref} />);
        };
    };
}
