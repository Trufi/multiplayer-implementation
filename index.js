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
import {implementUserActions} from './common';

// client

let playerCounter = 1;
const createPlayer = (x, y) => ({x, y, id: playerCounter++});

const BUTTON_UP = '38';
const BUTTON_DOWN = '40';
const BUTTON_LEFT = '37';
const BUTTON_RIGHT = '39';

const state = {
    time: 0,
    users: {},
    player: {
        id: null,
        buttonsDown: {},
        actions: []
    },
    lastTimeSending: 0,
    dataFromServer: []
};

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

const player = createPlayer(0, 0);
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
        sendToServer('actions', {
            playerId: state.player.id,
            actions: state.player.actions.slice()
        });
        state.player.actions = [];
        state.lastTimeSending = state.time;
    }
};

const updateFromServer = state => {
    if (!state.dataFromServer.length) { return; }

    //const users = state.dataFromServer.users;
    state.dataFromServer.forEach(data => {
        const users = data.users;

        for (const id in users) {
            const user = users[id];
            state.users[id].x = user.x;
            state.users[id].y = user.y;
        }
    });

    state.dataFromServer = [];
};

const implementActions = state => {
    implementUserActions(state.player.actions, state.users[state.player.id]);
};

const loop = () => {
    requestAnimationFrame(loop);

    state.time = Date.now();

    updatePlayerActions(state);

    updateFromServer(state);

    implementActions(state);

    playerView.draw(state.users);

    sendPlayerActions(state);
};

requestAnimationFrame(loop);
