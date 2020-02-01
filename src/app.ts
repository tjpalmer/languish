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

export interface Metric {
  name: string;
  value: number;
}

export type Keyed<Item> = {
  [key: string]: Item;
};

export interface Color {
  hue: number;
  saturation: number;
}

export interface Data {
  colors: {[name: string]: Color};
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
    this.counts = this.findLatestCounts();
    this.actives = this.counts.slice(0, 10);
    console.log(this.state);
    this.chart = this.makeChart();
    this.makeLegend();
  }

  private actives: Metric[];

  private chart: Chart;

  private counts: Metric[];

  private state: State;

  private findLatestCounts() {
    let date = this.latestDate();
    let key = this.state.y;
    let {entries} = this.state.data;
    let counts = Object.entries(entries).map(([name, langEntries]) => {
      let last = langEntries.slice(-1)[0];
      // Default to 0 if absent.
      let value = last.date == date ? last[key] : 0;
      return {name, value} as Metric;
    });
    // Sort descending.
    return counts.sort((a, b) => b.value - a.value);
  }

  private latestDate() {
    return this.state.data.dates.slice(-1)[0];
  }

  private makeChart() {
    let plot = document.querySelector('.plot')!;
    let canvas = plot.querySelector('canvas')!;
    let context = canvas.getContext('2d')!;
    let chart = new Chart(context, {
      data: {
        datasets: this.actives.map(({name}) => {
          return this.makeDataset(name);
        }),
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
    return chart;
  }

  private makeDataset(name: string) {
    return {
      borderColor: formatColor(this.state.data.colors[name]),
      cubicInterpolationMode: 'monotone',
      data: this.state.data.entries[name].map(entry => {
        // Remember [{x, y}, ...] for 2D.
        return 100 * entry[this.state.y] /
          this.state.data.sums[entry.date][this.state.y];
      }),
      fill: false,
      label: name,
    } as ChartDataSets;
  }

  private makeLegend() {
    let box = document.querySelector('.legend')!;
    let {colors} = this.state.data;
    box.innerHTML = '';
    let table = document.createElement('table');
    for (let count of this.counts.slice(0, 10)) {
      let {name} = count;
      let row = document.createElement('tr');
      let marker = document.createElement('td');
      marker.style.background = formatColor(colors[name]);
      marker.style.width = '1em';
      row.appendChild(marker);
      let label = document.createElement('td');
      label.innerText = name;
      row.appendChild(label);
      table.appendChild(row);
    }
    box.appendChild(table);
  }

}

function formatColor(color: Color) {
  return `hsl(${color.hue}, ${color.saturation}%, 70%)`;
}
