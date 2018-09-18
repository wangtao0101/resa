
import createResa from './resa';
import Provider from './components/Provider';
import createConnect from './components/Connect';
import combineModel from './utils/combineModel';

import Model from './decorators/Model';
import effect from './decorators/effect';
import reducer from './decorators/reducer';
import wapper from './decorators/wapper';
import init from './decorators/init';

const connect = createConnect();

export default createResa;
export {
    Provider,
    connect,
    combineModel,
    Model,
    effect,
    reducer,
    wapper,
    init
};
