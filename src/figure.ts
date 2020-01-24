export class Figure {

  constructor(parent: HTMLElement) {
    this.parent = parent;
    parent.style.position = 'relative';
    let svg = document.createElementNS(xmlns, 'svg') as SVGElement;
    svg.style.position = 'absolute';
    svg.style.width = '100%';
    svg.style.height = '100%';
    parent.appendChild(svg);
    this.svg = svg;
    svg.style.border = '1px dashed gray'
  }

  parent: HTMLElement;

  plot(options: SeriesOptions): Series {
    let series = new Series(this, options);
    return series;
  }

  max = new Point(-Infinity, -Infinity);

  min = new Point(Infinity, Infinity);

  svg: SVGElement;

  updateViewBox() {
    // TODO Instead base view box on screen space and use separate internal
    // TODO transform.
    let {x, y} = this.min;
    this.svg.setAttribute(
      'viewBox', [x, y, this.max.x - x, this.max.y - y].join(' '),
    );
  }

}

export class Point {

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  x: number;

  y: number;

}

export class Series {

  constructor(figure: Figure, options: SeriesOptions) {
    this.figure = figure;
    this.options = options;
    this.updateFigure();
  }

  figure: Figure;

  options: SeriesOptions;

  updateFigure() {
    this.updateFigureBounds();
    this.updateLine();
  }

  private updateFigureBounds() {
    this.figure.min.x = Math.min(this.figure.min.x, ...this.options.x);
    this.figure.min.y = Math.min(this.figure.min.y, ...this.options.y);
    this.figure.max.x = Math.max(this.figure.max.x, ...this.options.x);
    this.figure.max.y = Math.max(this.figure.max.y, ...this.options.y);
    this.figure.updateViewBox();
  }

  updateLine() {
    let d = this.options.x.map((x, i) => {
      let command = i ? 'L' : 'M';
      let y = this.options.y[i];
      return `${command} ${x} ${y}`;
    }).join(' ');
    let path = document.createElementNS(xmlns, 'path') as SVGPathElement;
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'black');
    this.figure.svg.appendChild(path);
  }

}

export interface SeriesOptions {
  x: number[];
  y: number[];
}

let xmlns = "http://www.w3.org/2000/svg";
