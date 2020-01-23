import {Line} from 'chartist';

addEventListener('load', main);

async function main() {
  let files = {
    issues: 'gh-issue-event.json',
    pulls: 'gh-pull-request.json',
    pushes: 'gh-push-event.json',
    stars: 'gh-star-event.json',
  };
  let data = Object.assign(
    {},
    ...await Promise.all(Object.keys(files).map(async key => {
      let file = files[key];
      console.log(key, file);
      let content = await (await fetch(`./src/data/${file}`)).json();
      return {key: content};
    })),
  );
  let plot = document.querySelector('.plot');
  new Line(
    '.plot', {
      labels: [2016, 2017, 2018, 2019],
      series: [[100, 120, 180, 200]],
    }, {
      fullWidth: true,
    }
  );
}
