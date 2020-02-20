import * as tables from './data/data.json';
import {App, AppOptions, Data, DateMetrics, Entry, Keyed, labels} from './app';
import {murmur3} from 'murmurhash-js';

addEventListener('load', main);

function main() {
  let sums = keepFirst(keyOn({
    key: 'date', items: tableToItems(tables.sums as any) as DateMetrics[],
  }));
  let dates = Object.keys(sums).sort();
  let entries = keyOn({
    key: 'name',
    items: tableToItems(tables.items as any) as Entry[],
  });
  let colors = Object.assign({}, ...Object.keys(entries).map(name => {
    return {[name]: chooseColor(name)};
  })) as {[name: string]: string};
  let data = {colors, dates, entries, sums};
  // Normalize and mean in advance.
  normalize(data);
  putMean(data);
  // Fill in missing data here.
  // The idea is that this code is smaller than the compressed repeated zeros
  // would be in the preprocessed data -- and not too expensive to compute.
  fillDates(data);
  new App({data, ...parseArgs(entries)});
}

export interface Color {
  hue: number;
  saturation: number;
}

function chooseColor(name: string) {
  // Use a handpicked seed that looks nice enough for the current top 10.
  let hash = murmur3(name, 95);
  let hue = 360 * ((hash >> 16) & 0xFFFF) / 0xFFFF;
  let saturation = 100 * (0.3 + 0.7 * (hash & 0xFFFF) / 0xFFFF);
  return formatColor({hue, saturation});
}

function formatColor(color: Color) {
  return `hsl(${color.hue}, ${color.saturation}%, 70%)`;
}

function keepFirst<Item>(keyed: Keyed<Item[]>): Keyed<Item> {
  return Object.assign({}, ...Object.keys(keyed).map(key => {
    return {[key]: keyed[key][0]};
  }));
}

function parseArgs(entries: Keyed<Entry[]>) {
  let result = {} as AppOptions;
  let args = new URLSearchParams(window.location.hash.slice(1));
  // Get names.
  let namesText = args.get('names');
  if (namesText && namesText.length) {
    let names = namesText.split(',');
    // Map from lowercase to canonical.
    let nameMap = {} as {[lowerName: string]: string};
    for (let canonicalName in entries) {
      nameMap[canonicalName.toLowerCase()] = canonicalName;
    }
    names = names.map(name => nameMap[name.toLowerCase()]);
    names = names.filter(name => name && name.length);
    // Store them.
    if (names.length) {
      result.activeNames = new Set(names);
      result.trimmed = true;
    }
  }
  // Get y.
  let y = args.get('y');
  if (y && Object.keys(labels).includes(y)) {
    // Technically, 'date' can slip through, but eh.
    result.y = y as typeof result.y;
  }
  return result;
}

interface KeyOnArgs<Key extends keyof Item, Item> {
  key: Key;
  items: Item[];
}

function keyOn<Key extends keyof Item, Item>(
  args: KeyOnArgs<Key, Item>,
): Keyed<Item[]> {
  let {key, items} = args;
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

function fillDates({dates, entries}: Data) {
  for (let [name, points] of Object.entries(entries)) {
    if (points.length != dates.length) {
      // We have the extra points to fill in.
      let result = [];
      let p = 0;
      for (let date of dates) {
        let point: Entry = points[p];
        if (!point || point.date > date) {
          // Missing, so fill in zeros.
          point = Object.assign({}, ...Object.entries(points[0]).map(
            ([key, value]) => {
              if (key == 'date') {
                return {date};
              } else {
                return {[key]: typeof value == 'number' ? 0 : value};
              }
            },
          ));
          point.date = date;
        } else {
          // Already have a point for this date.
          if (point.date != date) {
            // No details, so these can coallesce in the console.
            // I only had these show up under a bug before, but I'd like to
            // leave this around just in case.
            console.warn('unrepresented date');
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

function normalize({entries, sums}: Data) {
  let keys =
    Object.keys(Object.values(sums)[0]).filter(key => key != 'date') as
    (keyof DateMetrics)[];
  for (let points of Object.values(entries)) {
    for (let point of points) {
      let sum = sums[point.date];
      for (let key of keys) {
        (point[key] as number) =
          100 * (point[key] as number) / (sum[key] as number);
      }
    }
  }
}

function putMean({entries, sums}: Data) {
  let keys =
    Object.keys(Object.values(sums)[0]).filter(key => key != 'date') as
    (keyof DateMetrics)[];
  for (let points of Object.values(entries)) {
    for (let point of points) {
      let sum =
        (keys.map(key => point[key]) as number[]).reduce((x, y) => x + y, 0);
      point.mean = sum / keys.length;
    }
  }
}

interface Table<Key extends keyof Item, Item> {
  keys: Key[];
  rows: Item[Key][][];
}

function tableToItems<Item, Key extends keyof Item>(
  table: Table<Key, Item>,
): Item[] {
  let {keys, rows} = table;
  let items = rows.map(row => Object.assign({}, ...keys.map((key, index) => {
    return {[key]: row[index]};
  }))) as Item[];
  return items;
}
