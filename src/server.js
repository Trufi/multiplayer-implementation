import config from './config';
import View from './View';
import {ping, updateUserPosition, implementUserActions} from './common';

let entropy = false;

document.getElementById('entropy').onclick = () => {
    entropy = true;
};

const playerView = new View('Server');

let playerCounter = 1;
const createPlayer = () => ({x: 0, y: 0, vx: 0, vy: 0, usedActions: [], id: playerCounter++});

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
    } else if (name === 'ping') {
        const client = clients.find(c => c.id === data.playerId);
        if (client) {
            sendToClient(client, 'pong', {time: Date.now()});
        }
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
    if (state.time - state.lastTimeSending < config.server.sendingInterval) {
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

const makeEntropy = state => {
    if (!entropy) {
        return;
    }

    for (const id in state.users) {
        const user = state.users[id];
        user.vx = (Math.random() - 0.5) * 2;
        user.vy = (Math.random() - 0.5) * 2;
    }

    entropy = false;
};

const loop = () => {
    setTimeout(loop, 0);

    const time = Date.now();

    if (time - state.lastTimeUpdate < config.server.updateInterval) {
        return;
    }

    const delta = state.time - time;
    state.time = time;

    makeEntropy(state);

    updateUsers(state, delta);

    playerView.draw(state.users);

    sendDataToUsers(state);

    state.lastTimeUpdate = time;
};

loop();
