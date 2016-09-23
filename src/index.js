import {
    ACTION_UP,
    ACTION_DOWN,
    ACTION_LEFT,
    ACTION_RIGHT,
    FIELD_SIZE,
    PING,
    CLIENT_SENDING_INTERVAL
} from './constants';

import {serverHandle, addClient} from './server';
import View from './View';
import {implementUserActions, createState, createPlayer, updateFromServer} from './common';

import './user';

// client

const BUTTON_UP = '38';
const BUTTON_DOWN = '40';
const BUTTON_LEFT = '37';
const BUTTON_RIGHT = '39';

const state = createState();

window.onkeydown = ev => {
    const key = ev.which;
    state.player.buttonsDown[key] = true;
};

window.onkeyup = ev => {
    const key = ev.which;
    state.player.buttonsDown[key] = false;
};

const updatePlayerActions = state => {
    const user = state.users[state.player.id];
    const player = state.player;

    for (const button in player.buttonsDown) {
        if (!player.buttonsDown[button]) {
            continue;
        }

        if (button === BUTTON_UP) {
            player.actions.push(ACTION_UP);
        } else if (button === BUTTON_DOWN) {
            player.actions.push(ACTION_DOWN);
        } else if (button === BUTTON_LEFT) {
            player.actions.push(ACTION_LEFT);
        } else if (button === BUTTON_RIGHT) {
            player.actions.push(ACTION_RIGHT);
        }
    }
};

const player = createPlayer(1, 0, 0);
state.users[player.id] = player;
state.player.id = player.id;

addClient({
    handle: (name, data) => {
        if (name === 'data') {
            state.dataFromServer.push(data);
        }
    }
});

const playerView = new View('Client');

const sendToServer = (name, data) => {
    setTimeout(() => {
        serverHandle(name, data);
    }, PING);
};

const sendPlayerActions = state => {
    if (state.time - state.lastTimeSending > CLIENT_SENDING_INTERVAL) {
        implementActions(state);
        sendToServer('actions', {
            playerId: state.player.id,
            actions: state.player.actions.slice()
        });
        state.player.actions = [];
        state.lastTimeSending = state.time;
    }
};

const implementActions = state => {
    implementUserActions(state.player.actions, state.users[state.player.id]);
};

const loop = () => {
    requestAnimationFrame(loop);

    state.time = Date.now();

    updatePlayerActions(state);

    updateFromServer(state);

    playerView.draw(state.users);

    sendPlayerActions(state);
};

requestAnimationFrame(loop);
