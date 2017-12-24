import * as React from 'react';
import * as ReactDOM from 'react-dom';
import createResa, { Provider } from 'resa';

import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import AppModel from './AppModel';

const app = createResa();
app.registerModel(new AppModel());

ReactDOM.render(
  <Provider resa={app}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
