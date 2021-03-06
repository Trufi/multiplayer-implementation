import * as interpolation from './linearInterpolation';
import * as ticker from './ticker';

import {
    ACTION_UP,
    ACTION_DOWN,
    ACTION_LEFT,
    ACTION_RIGHT,
    FIELD_SIZE,
    PLAYER_SPEED_STEP
} from './constants';

import config from './config';

export const ping = () => Math.round(config.ping.value + (Math.random() - 0.5) *
    config.ping.value * config.ping.randomFactor);

const clamp = (x1, x2, x) => Math.max(x1, Math.min(x2, x));

const setPlayerPosition = (user, x, y) => {
    user.x = clamp(0, FIELD_SIZE, x);
    user.y = clamp(0, FIELD_SIZE, y);
};

export const implementUserActions = (actions, user) => {
    actions.forEach(action => {
        if (action === ACTION_UP) {
            user.vy += PLAYER_SPEED_STEP;
        } else if (action === ACTION_DOWN) {
            user.vy -= PLAYER_SPEED_STEP;
        } else if (action === ACTION_LEFT) {
            user.vx += PLAYER_SPEED_STEP;
        } else if (action === ACTION_RIGHT) {
            user.vx -= PLAYER_SPEED_STEP;
        }
    });

    user.usedActions = [];
};

export const updateUserPosition = (user, delta) => {
    const nx = user.x + user.vx * delta;
    user.x = clamp(0, FIELD_SIZE, nx);

    if (nx !== user.x) {
        user.vx = 0;
    }

    const ny = user.y + user.vy * delta;
    user.y = clamp(0, FIELD_SIZE, ny);

    if (ny !== user.y) {
        user.vy = 0;
    }
};

// only in clients

export const createState = () => ({
    time: 0,
    users: {},
    player: {
        id: null,
        buttonsDown: {},
        actions: [],
        previousPositions: []
    },
    lastTimeSending: 0,
    dataFromServer: []
});

export const createPlayer = (id, x = 0, y = 0, vx = 0, vy = 0) => ({id, x, y, vx, vy});

export const updateFromServer = state => {
    if (!state.dataFromServer.length) { return; }

    // Отсекаем все старые стейты
    removeOldData(state.time - config.spectatorThreshold, state.dataFromServer);

    // Первый и второй элементы - две точки интерполяции
    const dataA = state.dataFromServer[0];
    const dataB = state.dataFromServer[1];

    if (!dataA || !dataB) {
        return;
    }

    // Применяем немедленные изменения, например, новый игрок
    updateImmediateData(state, dataA);

    interpolateData(state, dataA, dataB);

    correctPlayerPosition(state, state.dataFromServer[state.dataFromServer.length - 1]);
};

const correctPlayerPosition = (state, serverData) => {
    const playerId = state.player.id;
    if (!playerId) {
        return;
    }

    const user = state.users[playerId];

    if (user.tx) {
        user.x = clamp(0, FIELD_SIZE, user.x + ticker.get(user.tx, state.time));
    }

    if (user.ty) {
        user.y = clamp(0, FIELD_SIZE, user.y + ticker.get(user.ty, state.time));
    }

    const serverUser = serverData.users[playerId];

    const time = serverUser.lastClientTime;

    if (!serverUser) {
        console.log('no player from server');
        return;
    }

    const userA = state.player.previousPositions.find(positon => positon.time === time);

    if (!userA) {
        // console.log('Not found previousPosition');
        return;
    }

    // Корректируем текущие положение игрока с учетом ошибки в прошлом

    function getDelta(fromServer, last, current) {
        const d1 = fromServer - last;
        const d2 = fromServer - current;
        return Math.abs(d1) < Math.abs(d2) ? d1 : d2;
    }

    const deltaX = getDelta(serverUser.x, userA.x, user.x);
    const deltaY = getDelta(serverUser.y, userA.y, user.y);

    function minorUpdate() {
        console.log('MINOR ALARM', serverUser.x, serverUser.y, serverUser.vx, serverUser.vy);
        user.x = clamp(0, FIELD_SIZE, user.x + deltaX);
        user.y = clamp(0, FIELD_SIZE, user.y + deltaY);
        user.vx += getDelta(serverUser.vx, userA.vx, user.vx);
        user.vy += getDelta(serverUser.vy, userA.vy, user.vy);
        user.tx = null;
        user.ty = null;
    }

    function fullUpdate() {
        console.log('ALARM', serverUser.x, serverUser.y, serverUser.vx, serverUser.vy);
        user.x = serverUser.x;
        user.y = serverUser.y;
        user.vx = serverUser.vx;
        user.vy = serverUser.vy;
        user.tx = null;
        user.ty = null;
    }

    if (Math.abs(deltaX) < 100) {
        user.tx = ticker.start(config.player.syncTimeInterval, state.time, deltaX);
        user.vx += getDelta(serverUser.vx, userA.vx, user.vx);
    } else {
        minorUpdate();

        state.player.previousPositions = [];
        return;
    }

    if (Math.abs(deltaY) < 100) {
        user.ty = ticker.start(config.player.syncTimeInterval, state.time, deltaY);
        user.vy += getDelta(serverUser.vy, userA.vy, user.vy);
    } else {
        minorUpdate();
    }

    state.player.previousPositions = [];
};

const interpolateData = (state, dataA, dataB) => {
    const usersA = dataA.users;
    const usersB = dataB.users;

    for (const id in usersA) {
        if (Number(id) === state.player.id) {
            continue;
        }

        const userA = usersA[id];
        const userB = usersB[id];

        if (!userB) {
            continue;
        }

        const interpolationX = interpolation.start(dataA.time, userA.x, dataB.time, userB.x);
        const interpolationY = interpolation.start(dataA.time, userA.y, dataB.time, userB.y);

        state.users[id].x = interpolation.step(interpolationX, state.time - config.spectatorThreshold);
        state.users[id].y = interpolation.step(interpolationY, state.time - config.spectatorThreshold);
    }
};

const updateImmediateData = (state, data) => {
    const users = data.users;

    for (const id in users) {
        if (Number(id) === state.player.id) {
            continue;
        }

        const user = users[id];
        if (!state.users[id]) {
            state.users[id] = createPlayer(id);
        }
    }
};

const removeOldData = (time, data) => {
    let i;
    for (i = 0; i < data.length; i++) {
        if (data[i].time > time) {
            break;
        }
    }

    i = i - 1;

    if (i > 0) {
        data.splice(0, i);
    }
};
