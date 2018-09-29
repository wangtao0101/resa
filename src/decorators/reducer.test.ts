import { Model, reducer, wapper } from 'resa';

describe('reducer decorator', () => {
    test('default', () => {
        class A extends Model{
            @reducer()
            add(payload) {
                return this.state + 1;
            }
        }
        const B = new A();
        expect(A.prototype['__reducers__'].add).not.toBeUndefined();
    });

    test('pure', () => {
        class A extends Model{
            @reducer(true)
            add(state, action) {
                return this.state + 1;
            }
        }
        const B = new A();
        expect(A.prototype['__pureReducers__'].add).not.toBeUndefined();
    });
});
