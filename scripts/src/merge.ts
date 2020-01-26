import {readdirSync, readFileSync} from 'fs';
import {join} from 'path';

let files = {
  issues: 'gh-issue-event.json',
  pulls: 'gh-pull-request.json',
  pushes: 'gh-push-event.json',
  stars: 'gh-star-event.json',
};

function main() {
  let dir = './src/data';
  let mergeKeys = ['name', 'year', 'quarter'] as (keyof Count)[];
  let table = [] as Count[];
  for (let key of Object.keys(files) as (keyof typeof files)[]) {
    let kidFull = join(dir, files[key]);
    let items = JSON.parse(readFileSync(kidFull).toString()) as CountString[];
    let convertedItems = items.map(item => ({
      name: item.name,
      [key]: Number(item.count),
      quarter: Number(item.quarter),
      year: Number(item.year),
    }));
    if (table.length) {
      table = merge({a: table, b: convertedItems, on: mergeKeys});
      console.log(JSON.stringify(table, undefined, 2));
      break;
    } else {
      table = convertedItems;
    }
  }
}

interface Count {
  name: string;
  quarter: number;
  year: number;
}

type CountString = {[P in keyof Count]: string} & {count: string};

export interface MergeOptions<A, B> {
  a: A[];
  b: B[];
  on: (keyof Partial<A | B>)[];
}

export function merge<A, B>(options: MergeOptions<A, B>): (A & B)[] {
  let {a, b, on} = options;
  if (!a.length || !b.length) return [];
  let keysA = new Set(Object.keys(a[0]));
  let keysB = new Set(Object.keys(b[0]));
  let compares = on.map(key => {
    let value = a[0][key];
    if (typeof value == 'string') {
      return (x: A | B, y: A | B) =>
        (x[key] as unknown as string).localeCompare(
          y[key] as unknown as string,
        );
    } else {
      return (x: A | B, y: A | B) =>
        (x[key] as unknown as number) - (y[key] as unknown as number);
    }
  })
  let compareKeys = (x: A | B, y: A | B) => {
    if (!(x && y)) {
      if (x) {
        return -1;
      } else if (y) {
        return 1;
      }
      return 0;
    }
    for (let compare of compares) {
      let result = compare(x, y);
      if (result) {
        return result;
      }
    }
    return 0;
  };
  a = a.concat().sort(compareKeys);
  b = b.concat().sort(compareKeys);
  let extrasA = [...keysA].filter(key => !keysB.has(key));
  let extrasB = ([...keysB].filter(key => !keysA.has(key));
  console.error(a.slice(0, 10));
  console.error(extrasA);
  console.error(extrasB);
  let indexA = 0;
  let indexB = 0;
  while (indexA < a.length || indexB < b.length) {
    let itemA = a[indexA];
    let itemB = b[indexB];
    let comparison = compareKeys(itemA, itemB);
    if (comparison <= 0) {
      indexA += 1;
    } else {
      indexB += 1;
    }
  }
  return []
}

main()
