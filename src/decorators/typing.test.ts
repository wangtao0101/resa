import { Model, effect, reducer, init, wapper } from 'resa';
import Immutable from 'immutable';
import createResa from 'resa';

/**
 * plain state
 */

interface MyModelState {
    count: number;
}

@init<MyModelState>({
    name: 'model',
    state: {
        count: 0,
    }
})
class MyModel extends Model<MyModelState>{
    @effect()
    * delayAdd() {
        /**
         * type check
         */
        this.fulfilled({
            count: 1,
        })
        this.add();
        this.minus();
    }

    @reducer()
    add(): MyModelState {
        /**
         * type check
         */
        return {
            count: this.state.count + 1,
        };
    }

    /**
     * user spread replacing Object.assign to get type check
     */
    @reducer()
    minus(): MyModelState {
        return {...{
            count: this.state.count + 1,
        }};
    }

    @reducer()
    ful() {
        return this.fulfilled({
            count: 0,
        });
    }
}

describe('plain state typing success', () => {
    test('register model success', () => {
        const app = createResa();
        app.registerModel(new MyModel());
        app.models.model.delayAdd();
    });
})
