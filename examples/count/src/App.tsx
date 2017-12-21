import * as React from 'react';
import './App.css';
import AppModel from './AppModel';
import { connect } from 'resa';
import { wapper } from 'resa-class-model';

interface AppProps {
  count: number;
  appModel: AppModel; // annotation type, will inject by connect
}

class App extends React.Component<AppProps> {
  render() {
    return (
      <div className="App">
        <h1>{this.props.count}</h1>
        {/* add and addAsync have been transformed to action creaters,
            you just call them with arguments(type check payload)
        */}
        <button onClick={() => this.props.appModel.add(1)}>+</button> {/* type check here */}
        <button onClick={() => this.props.appModel.addAsync(2)}>async</button> {/* type check here */}
        <button
          onClick={
            () => wapper(this.props.appModel.addAsync(2)).then(() => { alert('callback'); })}
        >promise
        </button>
      </div>
    );
  }
}

const mapStateToProps = ({ appModel }: { appModel: AppModel }) => { // annotation type
  return {
    count: appModel.state.count
  };
};

const NewApp = connect(mapStateToProps, ['appModel'], null)(App); // connect model by name

export default NewApp;
