# resa

[![NPM version](https://img.shields.io/npm/v/resa.svg?style=flat)](https://www.npmjs.com/package/resa)
[![Build Status](https://img.shields.io/travis/wangtao0101/resa.svg?style=flat)](https://travis-ci.org/wangtao0101/resa)
[![Coverage Status](https://coveralls.io/repos/github/wangtao0101/resa/badge.svg?branch=master)](https://coveralls.io/github/wangtao0101/resa?branch=master)

[View README in English](https://github.com/wangtao0101/resa/blob/master/README.md)

基于typescript, redux, redux-saga, redux-action的前端框架。

## 安装
```
npm install resa --save
yarn add resa
```

## 特性
* 没有多余的redux样板代码
* 完全的智能提示 (by vscode、 typescript)
* 类型标注的redux store
* 类型安全的action creater和payload
* 使用redux-saga更好的控制副作用
* Action creater返回promise
* 更好的错误处理， 支持使用promise.catch
* 自动追踪state依赖，无需编写mapStateToProps函数，比react-redux的connect函数更容易使用
* 容易学习，容易编码，容易测试

## 为什么造轮子
我非常喜欢redux和redux-saga，但是它们在使用过程当中有许多问题, 现有的框架[dva](https://github.com/dvajs/dva),
 [mirror](https://github.com/mirrorjs/mirror)也没有彻底解决他们：
* 在大项目中到处都是样板代码
* 没有智能提示
* 没有类型检查
* 在redux-saga中错误处理不友好

## Examples
我们在online-vscode中集成了redux-devtools, 你可以点击 **Open in New Window** 按钮然后打开chrome redux-devtools来查看当你点击按钮时会派发什么action.

* [count](https://github.com/wangtao0101/resa/tree/master/examples/count) [codesandbox](https://codesandbox.io/s/6vyx2nvn6w)

## 第一眼
定义模型
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
        count: 0 // 类型检查
    }
})
export default class AppModel extends Model<AppState> {
    @effect() // 定义saga: 异步的action处理函数
    * addAsync(count: number) {
        yield delay(2000);
        this.add(count); // 类型检查
    }

    @reducer() // 定义reducer: 同步的action处理函数
    add(count: number) {
        return {
            count: this.state.count + count, // 类型检查
        };
    }
}
```
定义组件
```
// App.tsx
import * as React from 'react';
import AppModel from './AppModel';
import { subscribe, wapper } from 'resa';

interface AppProps {
    appModel: AppModel; // 类型检查, subscribe函数会注入
}

class App extends React.Component<AppProps> {
    render() {
        return (
            <div className="App">
                <h1>{this.props.appModel.state.count}</h1>
                {/* add和addAsync已经被转换成了action creaters
                    直接调用它就会派发action, 参数相当于有类型检查的payload
                */}
                <button onClick={() => this.props.appModel.add(1)}>+</button> {/* 类型检查 */}
                <button onClick={() => this.props.appModel.addAsync(2)}>async</button> {/* 类型检查 */}
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
使用Provider包裹应用，就像react-redux
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
所以你喜欢这样简洁的代码吗?

## What is resa？
resa = a simple way to use redux and redux-saga

## Docs
* [完整文档](https://wangtao0101.github.io/resa)

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/wangtao0101/resa/issues).
