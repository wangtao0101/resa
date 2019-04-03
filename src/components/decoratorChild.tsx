import * as React from 'react';
import { connect } from 'resa';

const mapStateToProps = (_app, _state) => ({
    a: 'a',
});

// @ts-ignore
@connect(
    mapStateToProps,
    ['model'],
    null,
    { forwardRef: true },
)
export default class DecoratorChild extends React.Component<any, any> {
    render() {
        return <div />;
    }
}
