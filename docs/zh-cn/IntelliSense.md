# 智能提示与类型检查

## 类型检查
### 在模型中获得类型检查
首先定义模型的state类型
```
interface AppState {
    count: number;
}
```

init注解支持泛型传入模型的state类型，这样初始化的state会获得类型检查。
```
@init<AppState>({
    name: 'appModel',
    state: {
        count: 0 // 获得类型检查
    }
})
```

基类Model支持泛型传入模型的state类型，在模型中所有对state的操作都能获得类型检查。
```
export default class AppModel extends Model<AppState> {
}
```

effect中内置reducer：this.fulfilled获得类型检查
```
@effect()
* addAsync(count: number) {
    this.fulfilled({
        count: this.state.count + count // 获得类型检查
    });
}
```

### 调用Action创建函数获得类型检测
```
// subscribe注入的模型通过类型标注获取智能提示
interface Props {
  count: number;
  appModel: AppModel;
}
props.appModel.addAsync(1); // 函数参数获得类型检查
```

### subscribe函数返回的组件获得JSX的参数检查
首先定义注入的Props。
```
interface Props {
  count: number;
  appModel: AppModel;
}
```

定义组件。
```
class App extends React.Component<AppProps> {
  render() {
    return (
      <div className="App">
        xxx
      </div>
    );
  }
}
```

最后连接组件。
```
const NewApp = subscribe({ appModel: AppModel }, { namespace: 'namespace' })(App);
```

使用NewApp组件时会获得JSX类型检查。

## 智能提示
在模型函数中获得state的智能提示。

![](../image/state.png)

在模型中调用其他reducer或effect时获得智能提示

*注意：在reducer函数中虽然可以提示effect函数，但是实际上不能调用。*

![](../image/modelhelp.png)

在组件中调用Action创建函数获得智能提示

![](../image/apphelp.png)


