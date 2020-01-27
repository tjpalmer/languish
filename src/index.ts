import {Chart} from 'chart.js';
import * as data from './data/data.json';

let files = {
  issues: 'gh-issue-event.json',
  pulls: 'gh-pull-request.json',
  pushes: 'gh-push-event.json',
  stars: 'gh-star-event.json',
};

addEventListener('load', main);

interface Count {
  name: string;
  quarter: number;
  year: number;
}

type CountString = {[P in keyof Count]: string} & {count: string};

type Counts = Count & Record<keyof typeof files, number>;

async function main() {
  console.log(data.keys);
  console.log(data.rows.slice(0, 10));
  initPlot();
}

function initPlot() {
  let plot = document.querySelector('.plot')!;
  let canvas = plot.querySelector('canvas')!;
  let context = canvas.getContext('2d')!;
  let chart = new Chart(context, {
    data: {
      datasets: [
        {
          borderColor: 'blue',
          cubicInterpolationMode: 'monotone',
          data: [{x: 0, y: 10}, {x: 1, y: 2}, {x: 2, y: 5}, {x: 3, y: 12}, {x: 2.5, y: 7}],
          fill: false,
          label: 'Something',
        }, {
          borderColor: 'red',
          cubicInterpolationMode: 'monotone',
          data: [{x: 0, y: 5}, {x: 1, y: 9}, {x: 2, y: 6}, {x: 3, y: 12}, {x: 2.5, y: 3}],
          fill: false,
          label: 'Other',
        }
      ],
      labels: [2015, 2016, 2017, 2018, 2019],
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
