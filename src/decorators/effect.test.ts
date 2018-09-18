import { Model, effect } from 'resa';

describe('effect decorator', () => {
    test('default takeEvery', () => {
        class A extends Model{
            @effect()
            * add() {
                yield 0;
            }
        }
        expect(Object.prototype.toString.call(A.prototype['__effects__'].add[0])).toEqual('[object Function]')
        expect(A.prototype['__effects__'].add[1]).toEqual('takeEvery');
    });

    test('takeLatest', () => {
        class A extends Model{
            @effect('takeLatest')
            * add() {
                yield 0;
            }
        }
        expect(Object.prototype.toString.call(A.prototype['__effects__'].add[0])).toEqual('[object Function]')
        expect(A.prototype['__effects__'].add[1]).toEqual('takeLatest');
    });

    test('throttle', () => {
        class A extends Model{
            @effect('throttle', 500)
            * add() {
                yield 0;
            }
        }
        expect(Object.prototype.toString.call(A.prototype['__effects__'].add[0])).toEqual('[object Function]')
        expect(A.prototype['__effects__'].add[1]).toEqual('throttle');
        expect(A.prototype['__effects__'].add[2]).toEqual(500);
    });
});
