import * as React from 'react';
import './App.css';
import AppModel from './AppModel';
import { subscribe, wapper } from 'resa';

interface AppProps {
    appModel: AppModel; // annotation type, will inject by connect
    outer: string;
}

class App extends React.Component<AppProps> {
    render() {
        return (
            <div className="App">
                <h1>{this.props.appModel.state.count}</h1>
                {/* add and addAsync have been transformed to action creaters,
            you just call them with arguments(type check payload)
        */}
                <button onClick={() => this.props.appModel.add(1)}>+</button> {/* type check here */}
                <button onClick={() => this.props.appModel.addAsync(2)}>async</button> {/* type check here */}
                <button
                    onClick={() =>
                        wapper(this.props.appModel.addAsync(2)).then(() => {
                            alert('callback');
                        })
                    }>
                    promise
                </button>
            </div>
        );
    }
}

const NewApp = subscribe({ appModel: AppModel }, { namespace: 'namespace' })(App);
export default NewApp;
