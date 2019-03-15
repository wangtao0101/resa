import { Model, reducer, init, effect } from 'resa';
import { delay } from 'redux-saga';

interface AppState {
    count: number;
}

@init<AppState>({
    name: 'appModel',
    namespace: 'namespace',
    state: {
        count: 0 // type check here
    }
})
export default class AppModel extends Model<AppState> {
    @effect() // define async action handle
    * addAsync(count: number) {
        yield delay(2000);
        this.add(count); // type check here
    }

    @reducer() // define redux reducer: sync action handle
    add(count: number) {
        return {
            count: this.state.count + count, // type check here
        };
    }
}
