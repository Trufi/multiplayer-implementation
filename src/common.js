import {
    ACTION_UP,
    ACTION_DOWN,
    ACTION_LEFT,
    ACTION_RIGHT,
    FIELD_SIZE,
    PLAYER_STEP
} from './constants';

const clamp = (x1, x2, x) => Math.max(x1, Math.min(x2, x));

const setPlayerPosition = (user, x, y) => {
    user.x = clamp(0, FIELD_SIZE, x);
    user.y = clamp(0, FIELD_SIZE, y);
};

export const implementUserActions = (actions, user) => {
    actions.forEach(action => {
        if (action === ACTION_UP) {
            setPlayerPosition(user, user.x, user.y - PLAYER_STEP);
        } else if (action === ACTION_DOWN) {
            setPlayerPosition(user, user.x, user.y + PLAYER_STEP);
        } else if (action === ACTION_LEFT) {
            setPlayerPosition(user, user.x - PLAYER_STEP, user.y);
        } else if (action === ACTION_RIGHT) {
            setPlayerPosition(user, user.x + PLAYER_STEP, user.y);
        }
    });

    user.usedActions = [];
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

export const createPlayer = (id, x, y) => ({x, y, id});

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
                state.users[id] = createPlayer();
            }

            state.users[id].x = user.x;
            state.users[id].y = user.y;
        }
    });

    state.dataFromServer = [];
};
