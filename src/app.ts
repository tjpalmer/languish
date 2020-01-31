import {Chart, ChartDataSets} from 'chart.js';

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
      x: state.x || 'date',
      y: state.y || 'stars',
    };
    console.log(this.state);
    let plot = document.querySelector('.plot')!;
    let canvas = plot.querySelector('canvas')!;
    let context = canvas.getContext('2d')!;
    let extract = (name: string, borderColor: string) => {
      return {
        borderColor,
        cubicInterpolationMode: 'monotone',
        data: this.state.data.entries[name].map(entry => {
          // Remember [{x, y}, ...] for 2D.
          return 100 * entry[this.state.y] /
            this.state.data.sums[entry.date][this.state.y];
        }),
        fill: false,
        label: name,
      } as ChartDataSets;
    };
    this.chart = new Chart(context, {
      data: {
        datasets: [
          extract('JavaScript', 'red'),
          extract('Go', 'orange'),
          extract('TypeScript', 'blue'),
        ],
        labels: this.state.data.dates,
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
            ticks: {
              callback: date => {
                return date.includes('Q1') ? date.replace('Q1', '') : '';
              },
            }
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
