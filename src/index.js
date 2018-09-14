
import createResa from './resa';
import Provider from './components/Provider';
import createConnect from './components/Connect';
import combineModel from './utils/combineModel';

const connect = createConnect();

export default createResa;
export {
    Provider,
    connect,
    combineModel
};
