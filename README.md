# resa

[![NPM version](https://img.shields.io/npm/v/resa.svg?style=flat)](https://www.npmjs.com/package/resa)
[![Build Status](https://img.shields.io/travis/wangtao0101/resa.svg?style=flat)](https://travis-ci.org/wangtao0101/resa)
[![Coverage Status](https://coveralls.io/repos/github/wangtao0101/resa/badge.svg?branch=master)](https://coveralls.io/github/wangtao0101/resa?branch=master)

[以中文查看](README_CN.md)

A simple framework based on typescript, redux, redux-saga, redux-action.

## Installation
```
npm install resa resa-class-model --save
yarn add resa resa-class-model
```

## Features
* No redundant redux boilerplate code
* Full IntelliSense with vscode and typescript using [resa-class-model](https://github.com/wangtao0101/resa-class-model)
* Typed redux store
* Typed action creater and payload
* Better side effects control with redux-saga
* Action creater born to be promise
* Better error handling, support use promise.catch to capture error
* Easy learn, easy write, easy test

## Motivation
Actually i like redux and redux-saga very much, but both them have many problems:
* Boilerplate code is everywhere when using redux, react-redux, redux-saga, redux-actions in the big project
* no IntelliSense
* no type-safe
* terrible error handling in redux-saga

## First sight
Define model
```
// AppModel.ts
import { Model, reducer, init, effect } from 'resa-class-model';
import { delay } from 'redux-saga';

interface AppState {
    count: number;
}

@init<AppState>({
    name: 'appModel',
    state: {
        count: 0 // type check here
    }
})
export default class AppModel extends Model<AppState> {
    @effect() // define async action handle
    * addAsync(count: number) {
        yield delay(2000);
        this.add(count); // type check here
    }

    @reducer() // define redux reducer: sync action handle
    add(count: number) {
        return this.fulfilled({
            count: this.state.count + count, // type check here
        });
    }
}

```
Define component
```
// App.tsx
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
```
wapper with Provider like react-redux
```
import createResa, { Provider } from 'resa';

import App from './App';
import AppModel from './AppModel';
const app = createResa();
app.registerModel(new AppModel());

ReactDOM.render(
  <Provider store={app.store} resa={app}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);
```
So, do you like the simplicity ?

## What is resa？
resa = a simple way to use redux and redux-saga

## Examples
[count](./examples/count)

## Docs

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/wangtao0101/resa/issues).
