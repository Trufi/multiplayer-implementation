import dat from 'dat-gui';

import {
    ACTION_UP,
    ACTION_DOWN,
    ACTION_LEFT,
    ACTION_RIGHT,
    FIELD_SIZE
} from './constants';

import config from './config';
import {serverHandle, addClient} from './server';
import View from './View';

import {
    ping,
    implementUserActions,
    createState,
    createPlayer,
    updateFromServer,
    updateUserPosition
} from './common';

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

const playerView = new View('Player');

const sendToServer = (name, data) => {
    setTimeout(() => {
        serverHandle(name, data);
    }, ping());
};

const sendPlayerActions = state => {
    if (state.time - state.lastTimeSending > config.player.updateInterval) {
        sendToServer('actions', {
            playerId: state.player.id,
            actions: state.player.actions.slice(),
            time: state.time
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

    const time = Date.now();
    const delta = state.time - time;

    state.time = time;

    updatePlayerActions(state);

    if (state.time - state.lastTimeSending > config.player.updateInterval) {
        implementActions(state);
    }

    updateUserPosition(state.users[state.player.id], delta);

    updateFromServer(state);

    // Сохраняем положение юзера, чтобы потом сравнить с сервером
    state.player.previousPositions.push(Object.assign({time}, state.users[state.player.id]));

    playerView.draw(state.users);

    sendPlayerActions(state);
};

requestAnimationFrame(loop);

// Enable dat-gui
const gui = new dat.GUI();
gui.width = 300;

const guiServer = gui.addFolder('Server');
guiServer.add(config.server, 'sendingInterval', 0, 100);
guiServer.add(config.server, 'updateInterval', 0, 100);

const guiPing = gui.addFolder('Ping');
guiPing.add(config.ping, 'value', 0, 1000);
guiPing.add(config.ping, 'randomFactor', 0, 1);

const guiPlayer = gui.addFolder('Player');
guiPlayer.add(config.player, 'updateInterval', 0, 1000);
guiPlayer.add(config.player, 'syncTimeInterval', 0, 10000);

gui.add(config, 'spectatorThreshold', 0, 1000);
gui.add(config, 'drawOtherMarks');
