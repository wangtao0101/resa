import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as warning from 'warning';

export const subscriptionShape = PropTypes.shape({
    trySubscribe: PropTypes.func.isRequired,
    tryUnsubscribe: PropTypes.func.isRequired,
    notifyNestedSubs: PropTypes.func.isRequired,
    isSubscribed: PropTypes.func.isRequired,
});

export const storeShape = PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
});

export const resaShape = PropTypes.shape({
    store: PropTypes.object.isRequired,
    runSaga: PropTypes.func.isRequired,
    models: PropTypes.object.isRequired,
    registerModel: PropTypes.func.isRequired,
});

let didWarnAboutReceivingStore = false;
function warnAboutReceivingStore() {
    if (didWarnAboutReceivingStore) {
        return;
    }
    didWarnAboutReceivingStore = true;

    warning(
        '<Provider> does not support changing `store` on the fly. ' +
            'It is most likely that you see this error because you updated to ' +
            'Redux 2.x and React Redux 2.x which no longer hot reload reducers ' +
            'automatically. See https://github.com/reactjs/react-redux/releases/' +
            'tag/v2.0.0 for the migration instructions.',
    );
}

export const ThemeContext = React.createContext<any>({});

export function createProvider(storeKey = 'store', subKey = undefined) {
    const resaKey = `${storeKey}Resa`;
    const subscriptionKey = subKey || `${storeKey}Subscription`;

    class Provider extends React.Component<any, any> {
        theme: { [x: string]: any; storeKey: string };
        constructor(props, context) {
            super(props, context);
            this[storeKey] = props.resa.store;
            this[resaKey] = props.resa;
            this.theme = {
                [storeKey]: this[storeKey],
                [subscriptionKey]: null,
                [resaKey]: this[resaKey],
                storeKey,
            };
        }

        getChildContext() {
            return {
                [storeKey]: this[storeKey],
                [subscriptionKey]: null,
                [resaKey]: this[resaKey],
            };
        }

        render() {
            return (
                <ThemeContext.Provider value={this.theme}>
                    {React.Children.only(this.props.children)}
                </ThemeContext.Provider>
            );
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        Provider.prototype.componentWillReceiveProps = function(nextProps) {
            if (this[storeKey] !== nextProps.resa.store) {
                warnAboutReceivingStore();
            }
        };
    }

    // @ts-ignore
    Provider.propTypes = {
        children: PropTypes.element.isRequired,
        resa: resaShape.isRequired,
    };

    // @ts-ignore
    Provider.childContextTypes = {
        [storeKey]: storeShape.isRequired,
        [subscriptionKey]: subscriptionShape,
        [resaKey]: resaShape.isRequired,
    };

    return Provider;
}

export default createProvider();
