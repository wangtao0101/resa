# resa

[![NPM version](https://img.shields.io/npm/v/resa.svg?style=flat)](https://www.npmjs.com/package/resa)
[![Build Status](https://img.shields.io/travis/wangtao0101/resa.svg?style=flat)](https://travis-ci.org/wangtao0101/resa)
[![Coverage Status](https://coveralls.io/repos/github/wangtao0101/resa/badge.svg?branch=master)](https://coveralls.io/github/wangtao0101/resa?branch=master)

[View README in English](README.md)

基于typescript, redux, redux-saga, redux-action的前端框架。

## 安装
```
npm install resa resa-class-model --save
yarn add resa resa-class-model
```

## 特性
* 没有多余的redux样板代码
* 完全的智能提示（by vscode、 typescript 、[resa-class-model](https://github.com/wangtao0101/resa-class-model)）
* 类型标注的redux store
* 类型安全的action creater和payload
* 使用redux-saga更好的控制副作用
* Action creater返回promise
* 更好的错误处理， 支持使用promise.catch
* 容易学习，容易编码，容易测试

## 为什么造轮子
我非常喜欢redux和redux-saga，但是它们在使用过程当中有许多问题, 现有的框架[dva](https://github.com/dvajs/dva),
 [mirror](https://github.com/mirrorjs/mirror)也没有彻底解决他们：
* 在大项目中到处都是样板代码
* 没有智能提示
* 没有类型检查
* 在redux-saga中错误处理不友好

## 第一眼
定义模型
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
        return this.fulfilled({
            count: this.state.count + count, // 类型检查
        });
    }
}
```
定义组件
```
// App.tsx
import AppModel from './AppModel';
import { connect } from 'resa';
import { wapper } from 'resa-class-model';

interface AppProps {
  count: number;
  appModel: AppModel; // 标注类型，帮助智能提示，实体由connect注入
}

class App extends React.Component<AppProps> {
  render() {
    return (
      <div className="App">
        <h1>{this.props.count}</h1>
        {/* add和addAsync已经被转换成了action creaters
            直接调用它就会派发action, 参数相当于有类型检查的payload
        */}
        <button onClick={() => this.props.appModel.add(1)}>+</button> {/* 类型检查 */}
        <button onClick={() => this.props.appModel.addAsync(2)}>async</button> {/* 类型检查 */}
        <button
          onClick={
            () => wapper(this.props.appModel.addAsync(2)).then(() => { alert('callback'); })}
        >promise
        </button>
      </div>
    );
  }
}

const mapStateToProps = ({ appModel }: { appModel: AppModel }) => { // 标注类型，帮助智能提示
  return {
    count: appModel.state.count // 类型检查
  };
};

const NewApp = connect(mapStateToProps, ['appModel'], null)(App); // 在connect中通过model name链接模型
```
使用Provider包裹应用，就像react-redux
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
所以你喜欢这样简洁的代码吗 ?

## What is resa？
resa = a simple way to use redux and redux-saga

## Examples
[count](./examples/count)

## Docs

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/wangtao0101/resa/issues).
