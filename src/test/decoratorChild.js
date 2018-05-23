import React from 'react';
import { connect } from './..';

const mapStateToProps = (_app, _state) => ({
    a: 'a',
});

@connect(mapStateToProps, ['model'], null)
export default class DecoratorChild extends React.Component { // eslint-disable-line
    render() {
        return <div />;
    }
}
