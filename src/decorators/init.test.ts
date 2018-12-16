import { Model, init } from 'resa';

describe('init decorator', () => {
    test('default parameter', () => {
        @init({state : {}})
        class A extends Model{
        }
        expect(A['__name__']).toEqual('A');
        expect(A['__state__']).toEqual({});
        expect(A['__namespace__']).toEqual('');
    });

    test('name parameter', () => {
        @init({ name: 'ccc', state : {} })
        class A extends Model{
        }
        expect(A['__name__']).toEqual('ccc');
        expect(A['__state__']).toEqual({});
    });

    test('namespace parameter', () => {
        @init({ name: 'ccc', namespace: 'aa', state : {} })
        class A extends Model{
        }
        expect(A['__name__']).toEqual('ccc');
        expect(A['__state__']).toEqual({});
        expect(A['__namespace__']).toEqual('aa');
    });

    test('state parameter', () => {
        @init({ state: {b: 'cc'}})
        class A extends Model{
        }
        expect(A['__name__']).toEqual('A');
        expect(A['__state__']).toEqual({b: 'cc'});
    });
});
