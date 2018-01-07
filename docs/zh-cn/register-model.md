# 模型加载卸载的时机

模型与React组件是密不可分的，推荐模型与组件同时加载卸载。
```
componentWillMount() {
    resa.resigterModel(...);
}

componentWillUnmount() {
    resa.unResigterModel(...);
}
```

