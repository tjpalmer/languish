import {Chart, ChartDataSets} from 'chart.js';

export interface Metrics {
  issues: number;
  pulls: number;
  pushes: number;
  stars: number;
}

let labels = {
  issues: 'Issues',
  pulls: 'Pull Requests',
  pushes: 'Pushes',
  stars: 'Stars',
};

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

export interface Data {
  colors: {[name: string]: string};
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
    let actives = this.counts.slice(0, 10);
    this.activeNames = new Set(actives.map(active => active.name));
    console.log(this.state);
    this.chart = this.makeChart();
    this.makeLegend();
    document.querySelector('.yLabel')!.textContent = labels[this.state.y];
  }

  private activeNames: Set<string>;

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
        // The order doesn't really matter here.
        datasets: [...this.activeNames].map(name => this.makeDataset(name)),
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
              fontColor: 'white',
            }
            // type: 'linear',
          }],
          yAxes: [{
            // scaleLabel: {display: true, labelString: 'Stars'},
            ticks: {
              callback: value => `${value}%`,
              fontColor: 'white',
            },
          }],
        },
        tooltips: {
          callbacks: {
            label: (item, data) =>
              `${data.datasets![item.datasetIndex!].label}: ` +
              `${Number(item.value).toFixed(2)}%`,
          },
        },
      },
      type: 'line',
    });
    return chart;
  }

  private makeDataset(name: string) {
    return {
      borderColor: this.state.data.colors[name],
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
    let box = document.querySelector('.listBox')!;
    let {colors} = this.state.data;
    box.innerHTML = '';
    let table = document.createElement('table');
    this.counts.forEach((count, index) => {
      let {name} = count;
      let row = document.createElement('tr');
      // Marker.
      let marker = document.createElement('td');
      let color = colors[name];
      if (this.activeNames.has(name)) {
        marker.classList.add('active');
        marker.style.background = color;
      }
      marker.classList.add('marker');
      marker.textContent = String(index + 1);
      marker.style.minWidth = '1em';
      row.appendChild(marker);
      // Label.
      let label = document.createElement('td');
      label.textContent = name;
      label.style.paddingLeft = '0.2em';
      row.appendChild(label);
      table.appendChild(row);
    });
    box.appendChild(table);
  }

}
