import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as TestUtils from 'react-dom/test-utils';
import createResa, { Provider } from 'resa';

describe('Provider', () => {
    const createChild = (storeKey = 'store') => {
        const resaKey = `${storeKey}Resa`;
        class Child extends React.Component {
            static contextTypes: { [x: string]: PropTypes.Validator<object>; };
            render() {
                return <div />;
            }
        }

        Child.contextTypes = {
            [storeKey]: PropTypes.object.isRequired,
            [resaKey]: PropTypes.object.isRequired,
        };

        return Child;
    };
    const Child = createChild();

    test('should add resa to the child context', () => {
        const app = createResa();
        const tree = TestUtils.renderIntoDocument(
            <Provider resa={app}>
                <Child />
            </Provider>
        );

        const child = TestUtils.findRenderedComponentWithType(tree, Child);
        expect(child.context.store).toBe(app.store);
        expect(child.context.storeResa).toBe(app);
    });
});
