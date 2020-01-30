import { Chart } from 'chart.js';

export interface Metrics {
  issues: number;
  pulls: number;
  pushes: number;
  stars: number;
}

export interface DateMetrics extends Metrics {
  date: string;
}

export interface Entry extends DateMetrics {
  name: string;
}

export type Keyed<Item> = {
  [key: string]: Item;
};

export interface Data {
  dates: string[];
  entries: Keyed<Entry[]>;
  sums: Keyed<DateMetrics>;
}

export interface State {
  data: Data;
  names: string[];
  x: keyof DateMetrics;
  y: keyof Metrics;
}

export interface AppOptions extends Partial<State> {
  data: Data;
}

export class App {
  constructor(state: AppOptions) {
    this.state = {
      data: state.data,
      names: state.names || [],
      x: state.x || 'date', y: state.y || 'stars',
    };
    console.log(this.state);
    let plot = document.querySelector('.plot')!;
    let canvas = plot.querySelector('canvas')!;
    let context = canvas.getContext('2d')!;
    this.chart = new Chart(context, {
      data: {
        datasets: [
          {
            borderColor: 'blue',
            cubicInterpolationMode: 'monotone',
            data: this.state.data.entries['JavaScript'].map(entry => {
              return entry.stars;
            }),
            // data: [{ x: 0, y: 10 }, { x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 12 }, { x: 2.5, y: 7 }],
            fill: false,
            label: 'Something',
          }, {
            borderColor: 'red',
            cubicInterpolationMode: 'monotone',
            data: this.state.data.entries['TypeScript'].map(entry => {
              return entry.stars;
            }),
            // data: [{ x: 0, y: 5 }, { x: 1, y: 9 }, { x: 2, y: 6 }, { x: 3, y: 12 }, { x: 2.5, y: 3 }],
            fill: false,
            label: 'Other',
          }
        ],
        labels: datesToLabels(this.state.data.dates),
      },
      options: {
        animation: {
          duration: 0,
        },
        legend: {
          display: false,
        },
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          xAxes: [{
            // type: 'linear',
          }],
        },
      },
      type: 'line',
    });
  }
  chart: Chart;
  state: State;
}

function datesToLabels(dates: string[]): string[] {
  return dates.map(date => {
    return date.includes('Q1') ? date.replace('Q1', '') : '';
  });
}