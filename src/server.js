import {
    SERVER_SENDING_INTERVAL,
    SERVER_UPDATE_INTERVAL
} from './constants';

import View from './View';
import {ping, updateUserPosition, implementUserActions} from './common';

const playerView = new View('Server');

let playerCounter = 1;
const createPlayer = () => ({x:0, y: 0, vx: 0, vy: 0, usedActions: [], id: playerCounter++});

const createState = () => ({
    time: 0,
    users: {},
    lastTimeSending: 0,
    lastTimeUpdate: 0
});

const state = createState();

const clients = [];

export const addClient = client => clients.push(client);

export const serverHandle = (name, data) => {
    if (name === 'actions') {
        if (!state.users[data.playerId]) {
            state.users[data.playerId] = createPlayer();
        }
        state.users[data.playerId].usedActions = data.actions;
        state.users[data.playerId].lastClientTime = data.time;
    }
};

const updateUsers = (state, delta) => {
    for (const id in state.users) {
        const user = state.users[id];
        const actions = user.usedActions;
        implementUserActions(actions, user);
        updateUserPosition(user, delta);
    }
};

const sendToClient = (client, name, data) => {
    setTimeout(() => {
        client.handle(name, data);
    }, ping());
};

const sendDataToUsers = state => {
    if (state.time - state.lastTimeSending < SERVER_SENDING_INTERVAL) {
        return;
    }

    const data = {
        users: {},
        time: state.time
    };

    for (const id in state.users) {
        const user = state.users[id];

        data.users[id] = Object.assign({}, user);
    }

    clients.forEach(client => sendToClient(client, 'data', data));

    state.lastTimeSending = state.time;
};

const loop = () => {
    setTimeout(loop, 0);

    const time = Date.now();

    if (time - state.lastTimeUpdate < SERVER_UPDATE_INTERVAL) {
        return;
    }

    const delta = state.time - time;
    state.time = time;

    updateUsers(state, delta);

    playerView.draw(state.users);

    sendDataToUsers(state);
};

loop();
