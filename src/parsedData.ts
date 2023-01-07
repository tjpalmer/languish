// 1:1 port of index.ts from the non-preact version
import tables from "data.json";
import { murmur3 } from "murmurhash-js";

export interface CoreMetrics {
  issues: number;
  pulls: number;
  stars: number;
  soQuestions: number;
}

export const defaultWeights: CoreMetrics = Object.freeze({
  issues: 1,
  pulls: 0,
  stars: 1,
  soQuestions: 1,
});

export type CoreMetricTexts = {
  [key in keyof CoreMetrics]: string;
};

export interface Metrics extends CoreMetrics {
  mean: number;
}

interface DateMetrics extends Metrics {
  date: string;
}

interface Entry extends DateMetrics {
  name: string;
}

export interface Translation {
  key: string;
  reddit: string;
  stackoverflow: string;
  wikipedia: string;
}

type Keyed<Item> = {
  [key: string]: Item;
};

interface Data {
  colors: { [name: string]: string };
  dates: string[];
  entries: Keyed<Entry[]>;
  sums: Keyed<DateMetrics>;
}

export type MeanParams = {
  entries: Keyed<Entry[]>;
  sums: Keyed<DateMetrics>;
  weights: CoreMetrics;
};

function keepFirst<Item>(keyed: Keyed<Item[]>): Keyed<Item> {
  return Object.assign(
    {},
    ...Object.keys(keyed).map((key) => {
      return { [key]: keyed[key][0] };
    })
  );
}

interface KeyOnArgs<Key extends keyof Item, Item> {
  key: Key;
  items: Item[];
}

function keyOn<Key extends keyof Item, Item>(
  args: KeyOnArgs<Key, Item>
): Keyed<Item[]> {
  let { key, items } = args;
  let result = {} as Keyed<Item[]>;
  for (let item of items) {
    let keyVal = item[key] as unknown as string;
    let list = result[keyVal];
    if (!list) {
      result[keyVal] = list = [];
    }
    list.push(item);
  }
  return result;
}

function fillDates({ dates, entries }: Data) {
  for (let [name, points] of Object.entries(entries)) {
    if (points.length !== dates.length) {
      // We have the extra points to fill in.
      let result = [];
      let p = 0;
      for (let date of dates) {
        let point: Entry = points[p];
        if (!point || point.date > date) {
          // Missing, so fill in zeros.
          point = Object.assign(
            {},
            ...Object.entries(points[0]).map(([key, value]) => {
              if (key === "date") {
                return { date };
              } else {
                return { [key]: typeof value === "number" ? 0 : value };
              }
            })
          );
          point.date = date;
        } else {
          // Already have a point for this date.
          if (point.date !== date) {
            // No details, so these can coallesce in the console.
            // I only had these show up under a bug before, but I'd like to
            // leave this around just in case.
            console.warn("unrepresented date");
          }
          p += 1;
        }
        // Whether the old point or new, we have something to add in.
        result.push(point);
      }
      // Replace the entries with the full list.
      entries[name] = result;
    }
  }
}

function normalize({ entries, sums }: Data) {
  let keys = Object.keys(Object.values(sums)[0]).filter(
    (key) => key !== "date"
  ) as (keyof Metrics)[];
  for (let points of Object.values(entries)) {
    for (let point of points) {
      let sum = sums[point.date];
      for (let key of keys) {
        (point[key] as number) =
          (100 * (point[key] as number)) / (sum[key] as number);
      }
    }
  }
}

export function parseWeights(texts: CoreMetricTexts): CoreMetrics {
  return Object.fromEntries(
    Object.entries(texts).map(([key, value]) => {
      let parsed = parseFloat(value);
      if (isNaN(parsed)) {
        parsed = 0;
      }
      return [key, parsed];
    })
  ) as unknown as Metrics;
}

export function putMean({ entries, sums, weights }: MeanParams) {
  const keys = Object.keys(weights) as (keyof CoreMetrics)[];
  const weightTotal = sumOf(Object.values(weights));
  for (const points of Object.values(entries)) {
    for (const point of points) {
      // TODO Use sums param to unweight missing values?
      const sum = sumOf(keys.map((key) => weights[key] * point[key]));
      point.mean = sum / weightTotal;
    }
  }
}

export function stringifyWeights(numbers: CoreMetrics): CoreMetricTexts {
  return Object.fromEntries(
    Object.entries(numbers).map(([key, value]) => [key, value.toString()])
  ) as unknown as CoreMetricTexts;
}

function sumOf(nums: number[]): number {
  return nums.reduce((x, y) => x + y, 0);
}

interface Table<Key extends keyof Item, Item> {
  keys: Key[];
  rows: Item[Key][][];
}

function tableToItems<Item, Key extends keyof Item>(
  table: Table<Key, Item>
): Item[] {
  let { keys, rows } = table;
  let items = rows.map((row) =>
    Object.assign(
      {},
      ...keys.map((key, index) => {
        return { [key]: row[index] };
      })
    )
  ) as Item[];
  return items;
}

export interface Color {
  hue: number;
  saturation: number;
}

function chooseColor(name: string) {
  // Use a handpicked seed that looks nice enough for the current top 10.
  let hash = murmur3(name, 95);
  let hue = (360 * ((hash >> 16) & 0xffff)) / 0xffff;
  let saturation = 100 * (0.3 + (0.7 * (hash & 0xffff)) / 0xffff);
  return formatColor({ hue, saturation });
}

function filterDate<Metrics extends DateMetrics>(items: Metrics[]): Metrics[] {
  // This hard codes to the quarter when our GitHub data starts.
  // Stack Overflow data starts earlier, but I don't want to rely on that
  // independently.
  return items.filter((item) => item.date >= "2012Q1");
}

function formatColor(color: Color) {
  return `hsl(${color.hue}, ${color.saturation}%, 70%)`;
}

let sums = keepFirst(
  keyOn({
    key: "date",
    items: filterDate(tableToItems(tables.sums as any) as DateMetrics[]),
  })
);
let dates = Object.keys(sums).sort();
let entries = keyOn({
  key: "name",
  items: filterDate(tableToItems(tables.items as any) as Entry[]),
});
let colors = Object.assign(
  {},
  ...Object.keys(entries).map((name) => {
    return { [name]: chooseColor(name) };
  })
) as { [name: string]: string };
let data = { colors, dates, entries, sums };
// Normalize and mean in advance.
normalize(data);
putMean({ entries: data.entries, sums: data.sums, weights: defaultWeights });
// Fill in missing data here.
// The idea is that this code is smaller than the compressed repeated zeros
// would be in the preprocessed data -- and not too expensive to compute.
fillDates(data);

let translations = keepFirst(
  keyOn({
    key: "key",
    items: tableToItems(tables.translations as any) as Translation[],
  })
);

export { colors, dates, entries, sums, translations };
