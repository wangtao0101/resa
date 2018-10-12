# 模型注册与使用

## 创建resa
```
const resa = createResa();
```
createResa会初始化redux store，支持用户传入额外的reducer和middleware。

## 模型注册
调用register函数，并传入新建的模型对象。
```
import AppModel from './AppModel';
const resa = createResa();
resa.register(new AppModel());
```

或者你可以将模型注册在namespace中：
```
resa.register(new AppModel(), 'namespace');
```

它们的区别是数据在redux state中的层级不同，不用namespace，模型的数据在根节点；使用namespace，模型的数据在namespace中。

如果同时使用上述两个方式注册appModel，那么redux的数据形状如下：
```
{
  appModel: {
    count: 0
  },
  namespace: {
    appModel: {
      count: 0
    }
  }
}
```

**模型在同一namespace中不能重复注册，但是可以在不同的namespace中注册**

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
        return {
            count: this.state.count + count,
        };
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
resa.register(new AppModel());

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


如果模型注册在namespace中，你可以使用namespace/${模型名称}调用模型
```
resa.register(new AppModel(), 'namespace');
resa.models.['namespace/model'].add(1);
```

## 在react中使用模型
为了方便你在react中使用createResa返回的resa对象，我们提供了Provider组件和subscribe高阶函数。

### Provider
将Provider组件包裹住其他组件替换掉react-redux的Provider组件
```
<Provider resa={resa}>
    <App />
</Provider>,
```

### subscribe
subscribe和react-redux的[connect函数用法](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options)类似，不过它更强大。

使用subscribe连接模型
```
const NewApp = subscribe({ appModel: AppModel }, { namespace: 'namespace' })(App);
```

subscribe函数的第一个参数是一个mapper，上述的代码表示将AppModel这个模型注入到App的props中，注入到props的属性名称为appModel，第二个参数是一个config对象，其中namespace表示注册的时候注册在某个namespace中。

#### 组件更新的时机
subscribe函数生成的高阶组件会监听组件对state的使用，如果你使用了state的某一个属性，那么当这个属性变化的时候就会更新组件（组件不能是PureComponent）。

这里要十分注意，为了保证性能（暂时使用defineProperty实现，如果用Proxy实现就没有性能问题），subscribe只会监听state的第一层属性。

举个例子，假设state的形状如下：
```
{
    a: 'aa';
    b: {
        c: 'cc',
    }
}
```
如果组件使用了a属性，那么a被修改时，组件会获得更新。如果组件使用了c属性，c被修改时，组件不会被更新。因此，这里要求修改state时，采用immutable的方式，推荐使用[immer](https://github.com/mweststrate/immer)，下面是推荐的修改属性c的方式：
```
@reducer()
add() {
    return {
        b: produce(this.state.b, draftState => {
            b.c = 'ccc';
        })
    });
}
```
