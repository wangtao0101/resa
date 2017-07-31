
import createResa from './resa';
import Provider from './Provider';
import createConnect from './Connect';

const connect = createConnect();
const connectModel = createConnect(true);

export default createResa;
export {
    Provider,
    connect,
    connectModel
};
