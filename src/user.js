import {addClient} from './server';
import View from './View';
import {updateFromServer, createState} from './common';
import config from './config';

const state = createState();

addClient({
    handle: (name, data) => {
        if (name === 'data') {
            state.dataFromServer.push(data);
        }
    }
});

const playerView = new View('Spectator');

const loop = () => {
    requestAnimationFrame(loop);

    state.time = Date.now();
    state.ping = {
        mean: config.ping.value,
        deviation: config.ping.value * config.ping.randomFactor
    };

    updateFromServer(state);

    playerView.draw(state.users);
};

requestAnimationFrame(loop);
