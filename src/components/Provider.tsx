import * as React from 'react';
import { Provider as ReactReduxProvider } from 'react-redux';
import { ResaContext } from './Context';

export interface IProviderProps {
    resa: any;
    context?: any;
}

export default class Provider extends React.Component<IProviderProps, any> {
    render() {
        const context = this.props.context || ResaContext;

        const store = this.props.resa.store;
        store.resa = this.props.resa;
        return (
            <ReactReduxProvider store={store} context={context}>
                {this.props.children}
            </ReactReduxProvider>
        );
    }
}
