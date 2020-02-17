import {Chart, ChartColor, ChartDataSets} from 'chart.js';

export interface CoreMetrics {
  issues: number;
  pulls: number;
  pushes: number;
  stars: number;
}

export interface Metrics extends CoreMetrics {
  mean: number;
}

let labels = {
  date: 'Date',
  issues: 'Issues',
  mean: 'Mean Score',
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
  trimmed: boolean;
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
      trimmed: false,
      x: state.x || 'date',
      y: state.y || 'mean',
    };
    let ranks = this.findLatestRanks();
    let actives = ranks.slice(0, 10);
    this.activeNames = new Set(actives.map(active => active.name));
    this.chart = this.makeChart();
    this.makeLegend(ranks);
    this.makeOptions();
    document.querySelector('.xLabel')!.textContent = labels[this.state.x];
    let yLabel = document.querySelector('.yLabel')!;
    yLabel.textContent = labels[this.state.y];
    yLabel.addEventListener('click', () => {
      let yOptions = document.querySelector('.yOptions') as HTMLElement;
      if (yOptions.style.display) {
        yOptions.style.display = '';
      } else {
        yOptions.style.display = 'block';
      }
    })
    document.querySelector('.clear')!.addEventListener('click', () => {
      this.clearActives();
    });
    document.querySelector('.reset')!.addEventListener('click', () => {
      // this.resetActives();
    });
    document.querySelector('.trim')!.addEventListener('click', () => {
      this.toggleTrimmed();
    });
  }

  private activeNames: Set<string>;

  private chart: Chart;

  private clearActives() {
    this.activeNames.clear();
    this.chart.data.datasets = [];
    this.chart.update();
    let markers =
      document.querySelectorAll('.listBox .marker') as Iterable<HTMLElement>;
    for (let marker of markers) {
      marker.classList.remove('active');
      marker.style.background = '';
    }
  }

  private findLatestRanks(offset = -1) {
    let date = this.latestDate();
    let key = this.state.y;
    let {entries} = this.state.data;
    let counts = Object.entries(entries).map(([name, langEntries]) => {
      let value = langEntries.slice(offset)[0][key];
      return {name, value} as Metric;
    });
    // Sort descending.
    // TODO Sort by sequence newest to oldest dates, current metric then mean.
    counts.sort((a, b) => b.value - a.value);
    countsToRanks(counts);
    return counts;
  }

  private latestDate() {
    return this.state.data.dates.slice(-1)[0];
  }

  private makeChart() {
    // TODO For Metrics Mean total, first norm by max for metric total, then mean.
    let plot = document.querySelector('.plot')!;
    let canvas = plot.querySelector('canvas')!;
    let context = canvas.getContext('2d')!;
    let chart = new Chart(context, {
      data: {
        datasets: this.makeDatasets(),
        labels: this.state.data.dates,
      },
      options: {
        animation: {
          duration: 300,
        },
        hover: {
          animationDuration: 200,
          mode: 'dataset',
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
              suggestedMin: 0,
            },
          }],
        },
        tooltips: {
          bodyFontSize: 18,
          // I can't figure out how to remove the white border, but black here
          // softens it some.
          callbacks: {
            label: (item, data) =>
              `${data.datasets![item.datasetIndex!].label}: ` +
              `${Number(item.value).toFixed(2)}%`,
            labelColor: (item, chart) => {
              let dataset = chart.data.datasets![item.datasetIndex!];
              let color = dataset.borderColor as ChartColor;
              return {borderColor: 'black', backgroundColor: color};
            },
          },
          // mode: 'x',  // Would need to highlight current and refine.
          position: 'nearest',
          titleFontSize: 18,
          titleFontStyle: 'normal',
        },
      },
      type: 'line',
    });
    return chart;
  }

  private makeDataset(name: string) {
    let borderColor = this.state.data.colors[name];
    return {
      borderColor,
      cubicInterpolationMode: 'monotone',
      data: this.makeEntryData(name),
      fill: false,
      hoverBorderColor: borderColor,
      hoverBorderWidth: 6,
      pointHoverBackgroundColor: borderColor,
      label: name,
      pointBackgroundColor: borderColor,
    } as ChartDataSets;
  }

  private makeDatasets() {
    // The order doesn't really matter here.
    return [...this.activeNames].map(name => this.makeDataset(name));
  }

  private makeEntryData(name: string) {
    return this.state.data.entries[name].map(entry => {
      // Remember [{x, y}, ...] for 2D.
      return entry[this.state.y];
    });
  }

  private makeLegend(namedRanks: Metric[]) {
    let box = document.querySelector('.listBox')!;
    let {colors} = this.state.data;
    box.innerHTML = '';
    let table = document.createElement('table');
    let oldRanksRaw = this.findLatestRanks(-5);
    let worstRank = Math.min(
      oldRanksRaw.slice(-1)[0].value,
      namedRanks.slice(-1)[0].value);
    let oldRanks = metricArrayToObject(oldRanksRaw);
    namedRanks.forEach(namedRank => {
      let {name, value: rank} = namedRank;
      let row = document.createElement('tr');
      row.classList.add('interactive');
      row.addEventListener('click', event => this.toggle({name, row}));
      // Marker.
      let marker = document.createElement('td');
      let color = colors[name];
      if (this.activeNames.has(name)) {
        marker.classList.add('active');
        marker.style.background = color;
      }
      marker.classList.add('marker');
      marker.textContent = String(rank + 1);
      row.appendChild(marker);
      // Label.
      let label = document.createElement('td');
      label.classList.add('label');
      label.textContent = name;
      row.appendChild(label);
      // Rank change.
      let change = document.createElement('td');
      change.classList.add('change');
      let oldRank = oldRanks[name];
      let changeValue =
        Math.min(oldRank, worstRank) - Math.min(rank, worstRank);
      if (changeValue) {
        let prefix = changeValue > 0 ? '+' : '';
        change.textContent = `${prefix}${changeValue}`;
        change.title = 'Change in rank vs 1 year earlier';
      }
      row.appendChild(change);
      // Row done.
      table.appendChild(row);
    });
    box.appendChild(table);
  }

  makeOptions() {
    let list = document.querySelector('.yMetricsList')!;
    list.innerHTML = '';
    let keyLabels = Object.entries(labels).sort((a, b) => {
      return a[1].localeCompare(b[1]);
    }) as [keyof DateMetrics, string][];
    keyLabels.map(([key, label]) => {
      if (key != 'date') {
        let option = document.createElement('li');
        option.addEventListener('click', () => this.setY(key));
        option.classList.add('interactive');
        option.classList.add(key);
        if (key == this.state.y) {
          option.classList.add('active');
        }
        option.textContent = label;
        list.appendChild(option);
      }
    });
  }

  setY(key: keyof Metrics) {
    if (this.state.y != key) {
      let list = document.querySelector('.yMetricsList')!;
      this.state.y = key;
      this.updateData();
      document.querySelector('.yLabel')!.textContent = labels[this.state.y];
      for (let option of list.querySelectorAll('.interactive')) {
        if (option.classList.contains(key)) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      }
    }
  }

  private state: State;

  toggle(info: {name: string, row: HTMLElement}) {
    let {name, row} = info;
    let marker = row.querySelector('.marker') as HTMLElement;
    let label = row.querySelector('.label') as HTMLElement;
    let datasets = this.chart.data.datasets!;
    if (this.activeNames.has(name)) {
      this.activeNames.delete(name);
      marker.classList.remove('active');
      marker.style.background = '';
      this.chart.data.datasets =
        datasets.filter(dataset => dataset.label != name);
    } else {
      this.activeNames.add(name);
      marker.classList.add('active');
      marker.style.background = this.state.data.colors[name];
      datasets.push(this.makeDataset(name));
    }
    this.chart.update();
  }

  toggleTrimmed() {
    let trim = document.querySelector('.trim')!;
    let rows =
      document.querySelectorAll('.listBox tr') as Iterable<HTMLElement>;
    if (this.state.trimmed) {
      // Untrim.
      for (let row of rows) {
        row.style.display = '';
      }
      trim.classList.remove('checked');
      this.state.trimmed = false;
   } else {
      // Trim.
      for (let row of rows) {
        let marker = row.querySelector('.marker')!;
        if (!marker.classList.contains('active')) {
          row.style.display = 'none';
        }
      }
      trim.classList.add('checked');
      this.state.trimmed = true;
    }
  }

  updateData() {
    let counts = this.findLatestRanks();
    this.makeLegend(counts);
    for (let dataset of this.chart.data.datasets!) {
      let newData = this.makeEntryData(dataset.label!);
      dataset.data!.splice(0, dataset.data!.length, ...newData);
    }
    this.chart.update();
  }

}

function countsToRanks(counts: Metric[]) {
  let lastCount = NaN;
  let lastRank = 0;
  counts.forEach((count, rank) => {
    if (count.value == lastCount) {
      // Track ties.
      rank = lastRank;
    }
    // Remember new last.
    lastCount = count.value;
    lastRank = rank;
    // Update.
    count.value = rank;
  });
}

function metricArrayToObject(pairs: Metric[]) {
  let result = {} as {[name: string]: number};
  for (let pair of pairs) {
    result[pair.name] = pair.value;
  }
  return result;
}
