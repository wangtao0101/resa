import * as React from 'react';
import Subscription from 'react-redux/lib/utils/Subscription';
import { ResaContext } from '../components/Context';
import { useMemo } from 'react';
import { forwardComponent } from '../utils/help';

interface ExtraOptions {
    forwardRef?: any;
    context?: any;
}

export default function ResaHookWrap(extraOptions: ExtraOptions = {}) {
    const Context = extraOptions.context || ResaContext;

    return WrappedComponent => {
        const HookWrap = React.memo(function(props: { forwardedRef: any }) {
            const contextValue: any = React.useContext(Context);
            const store = contextValue.store;

            const [forwardedRef, wrapperProps] = useMemo(() => {
                const { forwardedRef, ...wrapperProps } = props;
                return [forwardedRef, wrapperProps];
            }, [props]);

            const [subscription, notifyNestedSubs] = useMemo(() => {
                const subscription = new Subscription(store, contextValue.subscription);

                const notifyNestedSubs = subscription.notifyNestedSubs.bind(subscription);
                return [subscription, notifyNestedSubs];
            }, [store, , contextValue]);

            const overriddenContextValue = useMemo(() => {
                return {
                    ...contextValue,
                    subscription,
                };
            }, [contextValue, subscription]);

            const renderChild = useMemo(() => {
                return (
                    <Context.Provider value={overriddenContextValue}>
                        <WrappedComponent ref={forwardedRef} {...wrapperProps} />
                    </Context.Provider>
                );
            }, [forwardedRef, wrapperProps]);

            return renderChild;
        });

        return forwardComponent(extraOptions.forwardRef, HookWrap, WrappedComponent, 'ResaHookWrape');
    };
}
