import {
    ACTION_UP,
    ACTION_DOWN,
    ACTION_LEFT,
    ACTION_RIGHT,
    FIELD_SIZE,
    PLAYER_SPEED_STEP
} from './constants';

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
    user.x = clamp(0, FIELD_SIZE, user.x + user.vx * delta);
    user.y = clamp(0, FIELD_SIZE, user.y + user.vy * delta);
};

// only in clients

export const createState = () => ({
    time: 0,
    users: {},
    player: {
        id: null,
        buttonsDown: {},
        actions: []
    },
    lastTimeSending: 0,
    dataFromServer: []
});

export const createPlayer = (id, x = 0, y = 0, vx = 0, vy = 0) => ({id, x, y, vx, vy});

export const updateFromServer = state => {
    if (!state.dataFromServer.length) { return; }

    state.dataFromServer.forEach(data => {
        const users = data.users;

        for (const id in users) {
            if (Number(id) === state.player.id) {
                continue;
            }
            const user = users[id];

            if (!state.users[id]) {
                state.users[id] = createPlayer(id);
            }

            state.users[id].x = user.x;
            state.users[id].y = user.y;
            state.users[id].vx = user.vx;
            state.users[id].vy = user.vy;
        }
    });

    state.dataFromServer = [];
};
