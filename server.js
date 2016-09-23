import {
    SERVER_SENDING_INTERVAL,
    PING
} from './constants';

import View from './View';
import {implementUserActions} from './common';

const playerView = new View('Server');

let playerCounter = 1;
const createPlayer = () => ({x:0, y: 0, usedActions: [], id: playerCounter++});

const state = {
    time: 0,
    users: {},
    lastTimeSending: 0
};

const clients = [];

export const addClient = client => clients.push(client);

export const serverHandle = (name, data) => {
    if (name === 'actions') {
        if (!state.users[data.playerId]) {
            state.users[data.playerId] = createPlayer();
        }
        state.users[data.playerId].usedActions = data.actions;
    }
};

const updateUsers = state => {
    for (const id in state.users) {
        const user = state.users[id];
        const actions = user.usedActions;
        implementUserActions(actions, user);
    }
};

const sendToClient = (client, name, data) => {
    setTimeout(() => {
        client.handle(name, data);
    }, PING);
};

const sendDataToUsers = state => {
    if (state.time - state.lastTimeSending < SERVER_SENDING_INTERVAL) {
        return;
    }

    const data = {
        users: {}
    };

    for (const id in state.users) {
        const user = state.users[id];

        data.users[id] = Object.assign({}, user);
    }

    clients.forEach(client => sendToClient(client, 'data', data));
};

const loop = () => {
    requestAnimationFrame(loop);

    state.time = Date.now();

    updateUsers(state);

    playerView.draw(state.users);

    sendDataToUsers(state);
};

requestAnimationFrame(loop);
