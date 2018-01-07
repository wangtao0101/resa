# 测试

定义一个简单的模型。
```
@init<AppState>({
    name: 'appModel',
    state: {
        count: 0
    }
})
export default class AppModel extends Model<AppState> {
    @effect() // define saga: async action handle
    * addAsync(count: number) {
        yield delay(2000);
        this.add(count);
    }

    @reducer()
    add(count: number) {
        return this.fulfilled({
            count: this.state.count + count
        });
    }
}
```

## 测试reducer
reducer测试相当简单，你只需要注册模型，直接调用reducer即可。
下面使用[jest](http://facebook.github.io/jest/)测试reducer的例子。
```
test('test reducer', () => {
    const resa = createResa();
    resa.registerModel(new AppModel());
    resa.models.appModel.add(1);
    expect(data).toEqual({
        resaReducer: {},
        appModel: {
            count: 1
        },
    });
});
```

## 测试effect
测试effect相对复杂，如果你调用了外部api，你可能需要mock，这取决你的应用。
下面使用[jest](http://facebook.github.io/jest/)测试effect的例子。
```
test('test reducer', () => {
    const resa = createResa();
    resa.registerModel(new AppModel());
    resa.models.appModel.addAsync(1);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(resa.models.appModel.state);
        }, 3000);
    }).then((data) => {
        expect(data).toEqual({
            count: 1,
        });
    });
});
```
