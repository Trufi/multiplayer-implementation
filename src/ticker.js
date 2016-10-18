export const start = (delay, now, value) => ({k: value / delay, last: value, now});

export const get = (st, time) => {
    const {k, last, now} = st;
    const r = Math.max(0, time - now) * k;

    let e;

    if (r > 0) {
        e = r < last ? r : last;
    } else {
        e = r > last ? r : last;
    }
    st.last -= e;
    st.now = time;
    return e;
};
