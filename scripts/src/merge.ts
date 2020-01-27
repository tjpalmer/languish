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
  let mergeKeys = ['name', 'date'] as (keyof Count)[];
  let entries = [] as Count[];
  for (let key of Object.keys(files) as (keyof typeof files)[]) {
    let kidFull = join(dir, files[key]);
    let items = JSON.parse(readFileSync(kidFull).toString()) as CountString[];
    let convertedItems = items.map(item => ({
      name: item.name,
      date: `${item.year}Q${item.quarter}`,
      [key]: Number(item.count),
    } as Count));
    if (entries.length) {
      entries = merge({a: entries, b: convertedItems, on: mergeKeys});
    } else {
      entries = convertedItems;
    }
  }
  // Convert to CSV-ish format and write.
  let table = tablify(entries);
  console.log(JSON.stringify(table, undefined, 2));
}

interface Count {
  name: string;
  date: string;
}

interface CountString {
  name: string;
  year: string;
  quarter: string;
  count: string;
}

export interface MergeOptions<A, B> {
  a: A[];
  b: B[];
  on: (keyof Partial<A | B>)[];
}

export function merge<A, B>(options: MergeOptions<A, B>): (A & B)[] {
  // Extract data and prep compares.
  let {a, b, on} = options;
  if (!a.length || !b.length) return [];
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
  // Cat arrays and prep merge.
  let combo = (a as (A | B)[]).concat(b).sort(compareKeys);
  let keysA = new Set(Object.keys(a[0]));
  let keysB = new Set(Object.keys(b[0]));
  let extrasA = [...keysA].filter(key => !keysB.has(key));
  let extrasB = [...keysB].filter(key => !keysA.has(key));
  let extras = extrasA.concat(extrasB).sort() as (keyof (A | B))[];
  let allKeys = on.concat(extras) as (keyof (A & B))[];
  //~ console.error(combo.slice(0, 10));
  //~ console.error(extras);
  let build = (item: A | B) => {
    let result = {} as A & B;
    for (let key of allKeys) {
      result[key] = item[key as keyof (A | B)] as any;
    }
    return result;
  };
  // Merge arrays.
  let results = [] as (A & B)[];
  let prev = build(combo[0]);
  let equals = 0, count = 0;
  for (let item of combo.slice(1)) {
    count += 1;
    let comparison = compareKeys(prev, item);
    if (comparison) {
      results.push(prev);
      prev = build(item);
    } else {
      for (let key of extras) {
        let value = (item as A & B)[key];
        if (value != null) {
          prev[key] = value;
        }
      }
      equals += 1;
    }
  }
  // Include the last one and done.
  results.push(prev);
  console.error(`${equals}/${count}`);
  return results;
}

interface Table<Item> {
  keys: (keyof Item)[];
  rows: Item[keyof Item][][];
}

function tablify<Item>(items: Item[]): Table<Item> {
  let keys = Object.keys(items[0]) as (keyof Item)[];
  let rows = items.map(item => keys.map(key => item[key]));
  return {keys, rows};
}

// Run main.
main()
