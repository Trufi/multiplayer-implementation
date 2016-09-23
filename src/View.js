import {FIELD_SIZE, POINT_SIZE} from './constants';

export default class View {
    constructor(text) {
        this.container = document.createElement('div');
        this.container.style.display = 'inline-block';
        this.container.style.marginRight = '10px';
        this.container.innerHTML = text + '<br>';
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        document.body.appendChild(this.container);

        this._ctx = this.canvas.getContext('2d');

        this.width = this.height = FIELD_SIZE;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    clear() {
        this._ctx.clearRect(0, 0, this.width, this.height);
    }

    draw(users) {
        this.clear();
        this.drawPoints(users);
    }

    drawPoints(points) {
        for (const id in points) {
            const p = points[id];
            this._ctx.fillRect(p.x - POINT_SIZE / 2, p.y - POINT_SIZE / 2, POINT_SIZE, POINT_SIZE);
        }
    }
}
