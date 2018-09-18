import * as React from 'react';
import { connect as reactReduxConnect } from 'react-redux';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import * as invariant from 'invariant';
import { storeShape, subscriptionShape, resaShape, ThemeContext } from './Provider';

interface extraOptions {
    storeKey: any;
    withRef: any;
}

export default function createConnect() {
    return (mapStateToProps, mapDispatchToProps, mergeProps = null, extraOptions = {}) => {
        const storeKey = (extraOptions as extraOptions).storeKey || 'store';
        const resaKey = `${storeKey}Resa`;
        const subscriptionKey = `${storeKey}Subscription`;

        const contextTypes = {
            [storeKey]: storeShape.isRequired,
            [subscriptionKey]: subscriptionShape,
            [resaKey]: resaShape.isRequired,
        };

        return function wrapWithConnect(WrappedComponent) {
            class Connect extends React.Component<any, any> {
                resa: any;
                wrappedInstance: null;
                static WrappedComponent: any;
                static displayName: string;
                static childContextTypes: { [x: string]: any;[x: number]: any; };
                static contextTypes: { [x: string]: any;[x: number]: any; };
                ConnectedComponent: any;
                constructor(props, context) {
                    super(props, context);
                    this.resa = props.theme[resaKey];
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
                            mapDispatchToProps.forEach(namespace => {
                                const model = this.resa.models[namespace];
                                models[namespace] = model;
                            });
                            return () => models;
                        }
                        return dispatch => mapDispatchToProps(this.resa.models, dispatch);
                    })();

                    // add withRef for all use case, user can use React.createRef() to get ref
                    (extraOptions as extraOptions).withRef = true;
                    this.ConnectedComponent = reactReduxConnect(
                        newMapStateToProps,
                        newMapDispatchToProps,
                        mergeProps,
                        extraOptions,
                    )(WrappedComponent);
                }

                getChildContext() {
                    return {
                        [storeKey]: this.context[storeKey],
                        [subscriptionKey]: this.context[subscriptionKey],
                        [resaKey]: this.context[resaKey],
                    };
                }

                setWappedInstance(ref) {
                    const forwardedRef = this.props.forwardedRef;
                    if (forwardedRef == null) {
                        return;
                    }

                    invariant(forwardedRef.hasOwnProperty('current'), 'You must use React.createRef() to create ref.');

                    if (ref == null) {
                        forwardedRef.current = null;
                        return;
                    }
                    if (forwardedRef) {
                        forwardedRef.current = ref.getWrappedInstance();
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
            // @ts-ignore
            const TargetComponent = hoistNonReactStatic(Connect, WrappedComponent);

            return React.forwardRef((props: any, ref: any) => (
                <ThemeContext.Consumer>
                    {theme => <TargetComponent {...props} forwardedRef={ref} theme={theme} />}
                </ThemeContext.Consumer>
            ));
        };
    };
}
