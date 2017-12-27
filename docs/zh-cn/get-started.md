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
npm install resa resa-class-model --save
yarn add resa resa-class-model
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
    @effect() // define saga: async action handle
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
app.registerModel(new AppModel());

ReactDOM.render(
  <Provider resa={app}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);
```

## 在组件中使用模型

