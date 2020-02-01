import * as tables from './data/data.json';
import {App, Color, DateMetrics, Entry, Keyed} from './app';
import {murmur3} from 'murmurhash-js';

addEventListener('load', main);

function main() {
  let sums = keepFirst(keyOn({
    key: 'date', items: tableToItems(tables.sums as any) as DateMetrics[],
  }));
  let entries = keyOn({
    key: 'name',
    items: tableToItems(tables.items as any) as Entry[],
  });
  let colors = Object.assign({}, ...Object.keys(entries).map(name => {
    return {[name]: chooseColor(name)};
  })) as {[name: string]: Color};
  let data = {
    colors,
    dates: Object.keys(sums).sort(),
    entries,
    sums,
  };
  new App({data});
}

function chooseColor(name: string) {
  let hash = murmur3(name, 64);
  let hue = 360 * ((hash >> 16) & 0xFFFF) / 0xFFFF;
  let saturation = 100 * (0.3 + 0.7 * (hash & 0xFFFF) / 0xFFFF);
  return {hue, saturation};
}

function keepFirst<Item>(keyed: Keyed<Item[]>): Keyed<Item> {
  return Object.assign({}, ...Object.keys(keyed).map(key => {
    return {[key]: keyed[key][0]};
  }));
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
