# resa

[![NPM version](https://img.shields.io/npm/v/resa.svg?style=flat)](https://www.npmjs.com/package/resa)
[![Build Status](https://img.shields.io/travis/wangtao0101/resa.svg?style=flat)](https://travis-ci.org/wangtao0101/resa)
[![Coverage Status](https://coveralls.io/repos/github/wangtao0101/resa/badge.svg?branch=master)](https://coveralls.io/github/wangtao0101/resa?branch=master)

[以中文查看](https://github.com/wangtao0101/resa/blob/master/README_CN.md)

A simple framework based on typescript, redux, redux-saga, redux-action.

## Installation
```
npm install resa --save
yarn add resa
```

## Features
* No redundant redux boilerplate code
* Full IntelliSense with vscode and typescript
* Typed redux store
* Typed action creater and payload
* Better side effects control with redux-saga
* Action creater born to be promise
* Better error handling, support use promise.catch to capture error
* auto detect dependence of state, without mapStateToProps, more easy than connect of react-redux
* Easy learn, easy write, easy test

## Motivation
Actually i like redux and redux-saga very much, but both them have many problems and they are not completely solved by existing packages like [dva](https://github.com/dvajs/dva),
 [mirror](https://github.com/mirrorjs/mirror):
* Boilerplate code is everywhere when using redux, react-redux, redux-saga, redux-actions in the big project
* no IntelliSense
* no Type-safe
* terrible error handling in redux-saga

## Examples
We hava integrated redux-devtool in online-vscode, you can click **Open in New Window** button and open chrome redux-devtool to see what action will be dispathed when you click button.

* [count](https://github.com/wangtao0101/resa/tree/master/examples/count) [online-vscode](https://stackblitz.com/edit/react-ts-84mcge)

## First sight
Define model
```
// AppModel.ts
import { Model, reducer, init, effect } from 'resa';
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
    @effect() // define saga: async action handle
    * addAsync(count: number) {
        yield delay(2000);
        this.add(count); // type check here
    }

    @reducer() // define redux reducer: sync action handle
    add(count: number) {
        return {
            count: this.state.count + count, // type check here
        };
    }
}

```
Define component
```
// App.tsx
import * as React from 'react';
import AppModel from './AppModel';
import { subscribe, wapper } from 'resa';

interface AppProps {
    appModel: AppModel; // annotation type, will inject by subscribe
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
```
wapper with Provider like react-redux
```
import createResa, { Provider } from 'resa';

import App from './App';
const app = createResa();

ReactDOM.render(
  <Provider resa={app}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);
```
So, do you like the simplicity ?

## What is resa？
resa = a simple way to use redux and redux-saga

## Docs
* [Full Documentation](https://wangtao0101.github.io/resa)

## 4.0 Break Change

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/wangtao0101/resa/issues).
