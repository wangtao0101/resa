# 模型（model)

## 模型就是一些状态和一组操作的集合。再直接一点，模型就是redux的一颗状态子树和操作这些状态的同步和异步操作的集合。

### 状态（state）
模型中的状态通常就是一个js对象，每个模型的状态都会根据模型名称挂载在redux的单一状态树上。state对象是不可变的，通常不能直接对它赋值。

在模型的reducer和effect函数中，可以通过this获取到模型的state
```
@reducer()
add() {
    console.log(this.state);
}
```

每个模型的状态必须有初始值，可以通过init注解注入。
```
@init({
    state: {
        count: 0
    }
})
export default class AppModel extends Model {

```

### reducer
就是redux的reducer函数，但是形式上有一些区别。resa会在注册模型的时候将reducer注入到redux中。

这是redux的reducer, 接受参数state和action, 一般要判断一下这个action.type是不是需要处理的类型。
```
function todoApp(state, action) {
  return state
}
```
这是resa模型中的reducer, state从this中获取，没有action参数，resa会帮你判断action.type，并且直接注入redcuer所需要的参数。
```
@reducer()
add(count: number) {
    return {
        count: this.state.count + count
    };
}
```
在reducer中，我们提供了一个内置的帮助函数this.fulfilled，这个帮助函数可以简化Object.assign的使用，并且提供类型检查。
```
@reducer()
add(count: number) {
    return this.fulfilled({
        count: this.state.count + count,
    });
}
```
this.fulfilled使用Object.assign合并对象：
```
Object.assign({}, state, payload)
```

### effect
effect就是[redux-saga](https://github.com/redux-saga/redux-saga)的saga函数，在resa中，effect就是异步处理函数。经过saga的加持，effect可以随心所欲的发起请求、控制异步操作。effect不能直接修改状态，只能通过调用reducer修改状态。resa内部提供了一个内置的reducer: this.fulfilled，这样你就不用为每个reffect都创建一个reducer。
```
@effect()
* addAsync(count: number) {
    yield delay(2000);

    this.add(count); // 调用我们定义reducer
    // or 调用内置的reducer
    return this.fulfilled({
        count: this.state.count + count.00001
    });
}
```
effect中的this.fulfilled合并对象的原则和reducer中的相同。

**注意：effect中的this.fulfilled和reducer中的this.fulfilled虽然名称是一样的，但是他们本质上是不同的，请不要混淆他们。在reducer中它只是一个帮助函数，而在effect中它会派发一个Action，并调用内置reducer。**

effect的默认[saga Helper](https://redux-saga.js.org/docs/api/index.html#saga-helpers)为takeEvery, 可以传递参数给effect修改默认的saga Helper，目前支持四种：takeEvery、takeLatest、throttle（effect第二个参数为时间ms）、takeFirst。
```
effect('throttle', 1000)
```

### 名称（name）
resa中模型名称必须唯一，你可以在init注解中传递模型名称。默认的模型名称为类名。
```
@init({
    name: 'appModel',
    state: {
        count: 0
    }
})
```


