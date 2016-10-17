export const start = (x1, y1, x2, y2) => {
    // y = a * x + b

    const d = x2 - x1;
    const a = d !== 0 ? (y2 - y1) / (x2 - x1) : 0;
    const b = y1 - a * x1;

    return {a, b};
};

export const step = ({a, b}, x) => {
    return a * x + b;
};

export const value = (x1, y1, x2, y2, x) => step(start(x1, y1, x2, y2), x);
