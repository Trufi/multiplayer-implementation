import {addClient} from './server';
import View from './View';
import {createPlayer, updateFromServer, createState} from './common';

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

    updateFromServer(state);

    playerView.draw(state.users);
};

requestAnimationFrame(loop);
