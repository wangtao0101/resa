
import createResa from './resa';

export default createResa;

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

