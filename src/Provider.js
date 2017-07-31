import { Component, Children } from 'react';
import PropTypes from 'prop-types';
import warning from 'react-redux/lib/utils/warning';

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
        'tag/v2.0.0 for the migration instructions.'
    );
}

export function createProvider(storeKey = 'store', subKey) {
    const resaKey = `${storeKey}Resa`;
    const subscriptionKey = subKey || `${storeKey}Subscription`;

    class Provider extends Component {

        constructor(props, context) {
            super(props, context);
            this[storeKey] = props.store;
            this[resaKey] = props.resa;
        }

        getChildContext() {
            return {
                [storeKey]: this[storeKey],
                [subscriptionKey]: null,
                [resaKey]: this[resaKey],
            };
        }

        render() {
            return Children.only(this.props.children);
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        Provider.prototype.componentWillReceiveProps = function (nextProps) { // eslint-disable-line
            if (this[storeKey] !== nextProps.store) {
                warnAboutReceivingStore();
            }
        };
    }

    Provider.propTypes = {
        store: storeShape.isRequired,
        children: PropTypes.element.isRequired,
        resa: resaShape.isRequired,
    };

    Provider.childContextTypes = {
        [storeKey]: storeShape.isRequired,
        [subscriptionKey]: subscriptionShape,
        [resaKey]: resaShape.isRequired,
    };

    return Provider;
}

export default createProvider();
