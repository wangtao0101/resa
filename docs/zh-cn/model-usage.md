# 模型注册与使用

## 模型注册
调用registerModel函数，并传入新建的模型对象。

```
import AppModel from './AppModel';
const resa = createResa();
resa.registerModel(new AppModel());
```

## 模型使用
调用resa上的Action创建函数来调用对应的reducer和effect，Action创建函数的名称和参数和你在模型中定义的
reducer和effect一模一样。

我们定义一个简单的模型。
```
@init({
    name: 'appModel',
    state: {
        count: 0
    }
})
export default class AppModel extends Model {
    @reducer()
    add(count: number) {
        return this.fulfilled({
            count: this.state.count + count,
        });
    }

    @effect()
    * addAsync(count: number) {
        this.fulfilled({
            count: this.state.count + count,
        });
    }
}
```

### 调用reducer
如何调用这个reducer呢？你可以像下面这样：
```
// 先注册模型
const resa = createResa();
resa.registerModel(new AppModel());

// 根据模型名称调用
resa.models.appModel.add(1);
```
add(1)函数会派发一个Action，格式如下：
```
{
  type: 'appModel/add',
  payload: {
    '0': 1
  }
}
```

### 调用effect
和调用reducer一样，直接调用effect函数名称：
```
resa.models.appModel.addAsync(1);
```
addAsync(1)会派发一个Action用来调用effect，格式如下：
```
{
  type: 'appModel/addAsync_ASYNC',
  payload: {
    '0': 1,
  },
}
```
this.fulfilled会派发一个Action用来调用内置reducer，格式如下：
```
{
  type: 'appModel/addAsync_ASYNC_FULFILLED',
  payload: {
    count: 1
  },
}
```

## 在react中使用模型
为了方便你在react中使用createResa返回的resa对象，我们包装了react-redux的Provider组件和connect函数。

### Provider
将Provider组件包裹住其他组件替换掉react-redux的Provider组件
```
<Provider resa={resa}>
    <App />
</Provider>,
```

### connect
和react-redux的[connect函数用法](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options)几乎一模一样，下面讲讲不同点：

* mapStateToProps多了第一个参数，该参数是所有模型的数组，你可以使用解构参数获取所需模型，并且通过模型的state字段获取模型状态。
```
const mapStateToProps = ({ appModel }) => {
    return {
        count: appModel.state.count
    };
};
```
* mapDispatchToProps也多了第一个参数，该参数也是所有模型的数组
```
const mapDispatchToProps = ({ appModel }, dispatch) => {
};
```
* mapDispatchToProp可以使用模型名称的数组代替，效果相当于把对应模型注入到了组件中。

InjectedProps可以帮助推断类型，详见[智能提示](./IntelliSense.md)
```
interface InjectedProps {
    appModel: AppModel;
}
connect<InjectedProps>(mapStateToProps, ['appModel'])(App);
```
你可以在组件的props上直接获取模型并派发Action。
```
this.props.appModel.add(1);
```

