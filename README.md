# resa

[![NPM version](https://img.shields.io/npm/v/resa.svg?style=flat)](https://www.npmjs.com/package/resa)
[![Build Status](https://img.shields.io/travis/wangtao0101/resa.svg?style=flat)](https://travis-ci.org/wangtao0101/resa)
[![Coverage Status](https://coveralls.io/repos/github/wangtao0101/resa/badge.svg?branch=master&dummy=no_cache_please_1)](https://coveralls.io/github/wangtao0101/resa?branch=master)


A simple framework based on redux, redux-saga, redux-action which can reduce the amount of code by almost 50%.

## Installation
```
npm install resa --save
yarn add resa
```

## Motivation
Boilerplate code is everywhere when using redux, react-redux, redux-saga, redux-actions in the big project.

The code maybe looks like this:
```
// Fisrt, you should define an action creator and export the action creator.
export const add = createAction('add');

// Second, you should define reducer using handleActions
export default handleActions({
    [add] : (state, action) => {
        return state + action.payload;
    },
}, {})

// Third, you should dispatch action in mapDispatchToProps using action creator.
import { add } from ''
import { connect } from 'react-redux'
const mapDispatchToProps = (dispatch) => ({
    add: (num) => {
        dispatch(add(num));
    },
});

// Last, you should map state to props using mapStateToProps
function mapStateToProps(state) {
  return { num: state }
}
export default connect(mapStateToProps, mapDispatchToProps)(View);
```

If you want to use redux-saga to control effects better, the code maybe looks like this:
```
export const query = createAction('add');
export const query_finished = createAction('query_finished');

export default handleActions({
    [query_finished] : (state, action) => {
        return Object.assign({}, state, {data: action.payload})
    },
}, {})

import { query } from ''
import { connect } from 'react-redux'
const mapDispatchToProps = (dispatch) => ({
    query: (id) => {
        dispatch(query(id));
    },
});

const mapStateToProps = (state) => {
  return { data: state.data }
}

export default connect(mapStateToProps, mapDispatchToProps)(View);

// saga.js
import { query } from ''
import { query_finished } from ''

function*  querySaga(action){
    const data = yield call(xxxApi) // fetch data
    yield put(query_finished({ data }));
}

export default function* saga() {
    yield takeLatest(query, querySaga);
}
```
The code above only show one action, so you can't imagine if there are hundreds of actions in one project.

## First sight
The code looks like this if using resa:
```
// define model
const model = {
    name: 'model',
    effects: {
        * query(payload) {
            const data = yield call(xxxApi) // fetch data
            yield this.fulfilled({ data }); // the fulfilled will merge data into state automatic.
        },
    },
};

import { connect } from 'resa';
const mapStateToProps = ({ model }, state, ownProps) => ({ // the first args model refer to above model
    data: model.getState().data, // you can use state.data as well
});

const mapDispatchToProps = ({ model }, dispatch) => ({ // the first args model refer to above model
    query: (id) => {
        return model.query(id) // the return object is a promise, so great!!!!
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(View);
```
So, do you like the simplicity ?

## What is resa？
resa = a simple way to use redux and redux-saga

## Docs
- [Getting Started](./docs/GettingStarted.md)
- [Api](./docs/Api.md)

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/wangtao0101/resa/issues).
