
import createResa from './resa';
import Provider from './Provider';
import createConnect from './Connect';
import combineModel from './combineModel';

const connect = createConnect();

export default createResa;
export {
    Provider,
    connect,
    combineModel
};
