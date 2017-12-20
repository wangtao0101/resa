# resa

[![NPM version](https://img.shields.io/npm/v/resa.svg?style=flat)](https://www.npmjs.com/package/resa)
[![Build Status](https://img.shields.io/travis/wangtao0101/resa.svg?style=flat)](https://travis-ci.org/wangtao0101/resa)
[![Coverage Status](https://coveralls.io/repos/github/wangtao0101/resa/badge.svg?branch=master)](https://coveralls.io/github/wangtao0101/resa?branch=master)

[View README in English](README.md)

基于typescript, redux, redux-saga, redux-action的前端框架。

## 安装
```
npm install resa --save
yarn add resa
```

## 特性
* 没有多余的redux样板代码
* 完全的智能提示（by vscode and typescript [resa-class-model](https://github.com/wangtao0101/resa-class-model)）
* 类型标注的redux store
* 类型安全的action creater和payload
* 使用redux-saga更好的控制副作用
* Action creater返回promise
* 更好的错误处理， 支持使用promise.catch
* 容易学习，容易编码，容易测试

## 为什么造轮子
Actually i like redux and redux-saga very much, but both them hava many problems:
* Boilerplate code is everywhere when using redux, react-redux, redux-saga, redux-actions in the big project
* no IntelliSense
* no type-safe
* terrible error handling in redux-saga

## 第一眼
Define model
```
import { Model, reducer, init, effect } from 'resa-class-model';
import { delay } from 'redux-saga';

interface AppState {
    count: number;
}

@init<AppState>({
    name: 'appModel',
    state: {
        count: 0
    }
})
export default class AppModel extends Model<AppState> {
    @effect()
    * addAsync(count: number) {
        yield delay(2000);
        this.add(count);
    }

    @reducer()
    add(count: number) {
        return this.fulfilled({
            count: this.state.count + count,
        })
    }
}

```
Define component
```
import AppModel from './AppModel';
import { connect } from 'resa';
import { wapper } from 'resa-class-model';

interface AppProps {
  count: number;
  appModel: AppModel; // annotation type
}

class App extends React.Component<AppProps> {
  render() {
    return (
      <div className="App">
        <h1>{this.props.count}</h1>
        <button onClick={() => this.props.appModel.add(1)}>+</button>
        <button onClick={() => this.props.appModel.addAsync(2)}>async</button>
        <button
          onClick={
            () => wapper(this.props.appModel.addAsync(2)).then(() => { alert('callback');})}
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
So, do you like the simplicity ?

## What is resa？
resa = a simple way to use redux and redux-saga

## Docs
- [Getting Started](./docs/GettingStarted.md)
- [Api](./docs/Api.md)

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/wangtao0101/resa/issues).
