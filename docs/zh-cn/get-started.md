# 在create-react-app中使用

## 安装create-react-app
```
npm install -g create-react-app yarn
```

## 使用TypeScript初始化项目
```
create-react-app my-app --scripts-version=react-scripts-ts
```

## 安装resa
```
npm install resa --save
yarn add resa
```

## 在tsconfig.json中开启支持Decorator
```
{
  "compilerOptions": {
      "experimentalDecorators": true,
  }
}
```

## 定义模型
src目录中添加文件AppModel.ts
```
// AppModel.ts
import { Model, reducer, init, effect } from 'resa';
import { delay } from 'redux-saga';

interface AppState {
    count: number;
}

@init<AppState>({
    name: 'appModel',
    namespace: 'namespace',
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

## 创建resa并注册模型
修改index.tsx文件
```
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import createResa, { Provider } from 'resa';

import App from './App';
import './index.css';
import AppModel from './AppModel';

const app = createResa();

ReactDOM.render(
  <Provider resa={app}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);
```

## 在组件中使用模型
修改App.jsx文件
```
import * as React from 'react';
import AppModel from './AppModel';
import { connect, wapper } from 'resa';

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

const NewApp = subscribe({ appModel: AppModel })(App);
export default NewApp;
```

## 启动项目
```
npm run start
yarn start
```
访问http://localhost:3000/
