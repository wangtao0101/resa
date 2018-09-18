
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { ThemeContext } from './Provider';

class ThemeSubscribe extends React.Component<any, any> {
    resa: any;

    constructor(props) {
        super(props);
        const resaKey = 'storeResa';
        this.resa = props.theme[resaKey];
        // register
    }

    componentWillUnmount() {
        // unregister
    }

    render() {
        // @ts-ignore
        return this.props.children();
    }
}

// @ts-ignore
ThemeSubscribe.propTypes = {
    theme: PropTypes.any.isRequired,
    children: PropTypes.func.isRequired,
};

const Subscribe = React.forwardRef((props, ref) => (
    <ThemeContext.Consumer>
        {theme => <ThemeSubscribe {...props} forwardedRef={ref} theme={theme} />}
    </ThemeContext.Consumer>
));

export default Subscribe;
