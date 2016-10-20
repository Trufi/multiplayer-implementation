import {FIELD_SIZE, POINT_SIZE} from './constants';
import config from './config';

const container = document.getElementById('container');

const views = [];
const viewColors = {
    Server: [0, 0, 255],
    Player: [255, 0, 0],
    Spectator: [255, 255, 0]
}

export default class View {
    constructor(text) {
        this.text = text;
        this.color = viewColors[text];

        this.container = document.createElement('div');
        this.container.style.display = 'inline-block';
        this.container.style.marginRight = '10px';
        this.container.innerHTML = text + '<br>';
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        container.appendChild(this.container);

        this._ctx = this.canvas.getContext('2d');

        this.width = this.height = FIELD_SIZE;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.lastDrawPoints = {};

        views.push(this);
    }

    clear() {
        this._ctx.clearRect(0, 0, this.width, this.height);
    }

    draw(users) {
        this.clear();

        if (config.drawOtherMarks) {
            views.forEach(view => {
                if (view !== this) {
                    this.drawShadowPoints(view.lastDrawPoints, view.color);
                }
            });
        }

        this.drawPoints(users, this.color);
    }

    setColor(color, alpha) {
        if (!config.drawOtherMarks) {
            color = [0, 0, 0];
        }

        this._ctx.fillStyle = `rgba(${color.join(',')},${alpha})`;
    }

    drawPoints(points, color) {
        this.setColor(color, 1);

        for (const id in points) {
            const p = points[id];
            this._ctx.fillRect(p.x - POINT_SIZE / 2, p.y - POINT_SIZE / 2, POINT_SIZE, POINT_SIZE);
        }

        this.lastDrawPoints = points;
    }

    drawShadowPoints(points, color) {
        this.setColor(color, 0.2);

        for (const id in points) {
            const p = points[id];
            this._ctx.fillRect(p.x - POINT_SIZE / 2, p.y - POINT_SIZE / 2, POINT_SIZE, POINT_SIZE);
        }
    }
}
