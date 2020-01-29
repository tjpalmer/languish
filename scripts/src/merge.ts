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
  let items = [] as Count[];
  for (let key of Object.keys(files) as (keyof typeof files)[]) {
    let kidFull = join(dir, files[key]);
    let rawItems =
      JSON.parse(readFileSync(kidFull).toString()) as CountString[];
    let convertedItems = rawItems.map(item => ({
      name: item.name,
      date: `${item.year}Q${item.quarter}`,
      [key]: Number(item.count),
    } as unknown as Count));
    if (items.length) {
      items = merge({a: items, b: convertedItems, on: mergeKeys});
    } else {
      items = convertedItems;
    }
  }
  // Convert to CSV-ish format and write.
  // TODO Totals by quarter. Fraction for langs.
  let sums = sumGrouped({
    by: 'date', items, outs: Object.keys(files) as (keyof typeof files)[],
  });
  let tabled = {
    items: tablify(items),
    sums: tablify(sums),
  };
  console.log(JSON.stringify(tabled, undefined, 2));
}

interface Count {
  name: string;
  date: string;
  issues: number;
  pulls: number;
  pushes: number;
  stars: number;
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
      result[key] = item[key as keyof (A | B)] || 0 as any;
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

interface GroupOptions<Item, By extends keyof Item, Out extends keyof Item> {
  items: Item[];
  by: By;
  outs: Out[];
}

// TODO Typing here is a disaster. See if there are ways to fix it all.
function sumGrouped<Item, By extends keyof Item, Out extends keyof Item>(
  options: GroupOptions<Item, By, Out>,
): {[Key in By | Out]: Item[Key]}[] {
  let {items, by, outs} = options;
  type Sums = {[Key in By | Out]: Item[Key]};
  // Sum things up.
  let keyedSums = {} as {[ByKey: string]: Sums};
  for (let item of items) {
    // TODO How to assert at type level that item[by] is string and
    // TODO item[out] is number?
    let key = item[by] as unknown as string;
    let keyedSum = keyedSums[key];
    if (!keyedSum) {
      keyedSum = {[by]: key} as unknown as Sums;
      for (let out of outs) {
        keyedSum[out as keyof Sums] = 0 as any;
      }
      // console.error(key, keyedSum);
      keyedSums[key] = keyedSum;
    }
    for (let out of outs) {
      (keyedSum[out as keyof Sums] as unknown as number) +=
        // Treat missing values as 0.
        item[out] as unknown as number;
    }
  }
  // Sort array of sums.
  let sums = Object.keys(keyedSums).map(key => keyedSums[key]).sort((a, b) => {
    return ((a as any)[by] as string).localeCompare((b as any)[by]);
  });
  // // Normalize.
  // let normed = items.map(item => {
  //   item = Object.assign({}, item);
  //   let itemSums = keyedSums[item[by] as unknown as string];
  //   for (let out of outs) {
  //     (item[out] as unknown as number) /= itemSums[out] as unknown as number;
  //   }
  //   return item;
  // });
  // Done.
  return sums;
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
