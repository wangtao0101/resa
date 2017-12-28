# 联合模型

模型注册后状态会放在redux顶层，这样可能导致顶层数据过于臃肿，不同模块的数据耦合在一起。
```
state: {
    model1: {},
    model2: {},
    model3: {},
}
```
redux的combineReducer可以组合reducer，使得同一模块的state可以聚集在同一节点。
```
state: {
    combine: {
        model1: {},
        model2: {},
        model3: {},
    }
}
```
为了达到相同的效果，resa提供了combineModel函数组合模型，组合后的模型注册一次即可，并且支持嵌套。
```
const cm = combineModel('combine', [new Model1(), new Model2()]);
resa.registerModel(cm);

// redux state会变成如下所示
state: {
    combine: {
        model1: {},
        model2: {},
    }
}
```

combineModel注册后的模型仍然可以通过resa.models和connect获取，和注册的普通模型一样，combineModel只会改变redux state的层级。

[查看combineModel的例子](https://stackblitz.com/edit/react-ts-d1uenc)
