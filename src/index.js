
import createResa from './resa';
import Provider from './Provider';

export default createResa;
export {
    Provider
};

// import Immutable from 'immutable';
// import { call } from 'redux-saga/effects';
// import 'babel-polyfill';
// import createResa from './resa';
// import { createAction } from './action';

// const model = {
//     namespace: '_',
//     reducer: 'xxx',
//     effects: {
//         * add(app, action, { fulfilled, reject }) {
//             console.log(app.model);
//             console.log(action);
//             yield call(fulfilled, { a: 'a' });
//             // yield call(reject, { b: 'b' });
//             yield call(this.effects.minus, { c: ' c ' });
//         },
//         * minus(app, action, { fulfilled, reject }) {
//             console.log(app);
//             console.log(action);
//             yield call(fulfilled, { d: 'd' });
//         },
//     },
// };


// const app = createResa({ immutable: Immutable });

// app.registerModel(model);

// app.store.dispatch(createAction('add').pending());

// 提供一个方法，包装一下effects，这样其他地方可以拿到export app, 考虑更好的方式:
// 1. 提供一个辅助dispatch的函数 dispatch(help(app, app.effects.add, {}))
// 2. 提供一个mapDispatchToProps 包装函数
// 以上两种方法考虑都提供
// 最佳思路 提供一个Provider， 提供一个connect 包装 redux-connect 的 Provider 和 connect
// Provider 比较简单，提供一个app的context即可
// connect 包装 redux-connect的connect，首先拿到mapToProp 和mapToState， 包装处理后送给 redux-connect的connect
// 包装组件参考 react-router的withRouter组件
// https://github.com/ReactTraining/react-router/blob/v3.0.5/modules/withRouter.js

