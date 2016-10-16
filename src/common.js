import * as interpolation from './linearInterpolation';

import {
    ACTION_UP,
    ACTION_DOWN,
    ACTION_LEFT,
    ACTION_RIGHT,
    FIELD_SIZE,
    PLAYER_SPEED_STEP,
    PING,
    PING_RANDOM,
    USER_TIME_THRESHOLD
} from './constants';

export const ping = () => Math.round(PING + (Math.random() - 0.5) * PING_RANDOM);

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
    removeOldData(state.time - USER_TIME_THRESHOLD, state.dataFromServer);

    // Первый и второй элементы - две точки интерполяции
    const dataA = state.dataFromServer[0];
    const dataB = state.dataFromServer[1];

    if (!dataA || !dataB) {
        console.log('Not found dataFromServer');
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

    const time = serverData.time;

    const serverUser = serverData.users[playerId];

    if (!serverUser) {
        console.log('no player from server');
        return;
    }

    const [userA, userB] = findClampPoints(state.player.previousPositions, time);

    if (!userA || !userB) {
        console.log('Not found previousPositions');
        return;
    }

    const interpolationX = interpolation.start(userA.time, userA.x, userB.time, userB.x);
    const interpolationY = interpolation.start(userA.time, userA.y, userB.time, userB.y);

    const clientX = interpolation.step(interpolationX, time);
    const clientY = interpolation.step(interpolationY, time);

    // Корректируем текущие положение игрока с учетом ошибки в прошлом
    const user = state.users[playerId];

    const deltaX = serverUser.x - clientX;
    const deltaY = serverUser.y - clientY;

    // if (Math.abs(deltaX) < 50) {
    //     user.x = clamp(0, FIELD_SIZE, user.x + deltaX);
    // } else {
    //     user.x = serverUser.x;
    // }
    //
    // if (Math.abs(deltaY) < 50) {
    //     user.y = clamp(0, FIELD_SIZE, user.y + deltaY);
    // } else {
    //     user.y = serverUser.y;
    // }

    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        user.x = serverUser.x;
        user.y = serverUser.y;
        user.vx = serverUser.vx;
        user.vy = serverUser.vy;
        console.log('warning!');
    }

    state.player.previousPositions = [];
};

const findClampPoints = (array, time) => {
    // предполагаем, что array отсортирован по времени <
    let left, right;

    for (let i = 0; i < array.length; i++) {
        const el = array[i];
        if (el.time <= time) {
            left = el;
        }
        if (el.time >= time) {
            right = el;
        }
    }

    return [left, right];
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

        state.users[id].x = interpolation.step(interpolationX, state.time - USER_TIME_THRESHOLD);
        state.users[id].y = interpolation.step(interpolationY, state.time - USER_TIME_THRESHOLD);
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
