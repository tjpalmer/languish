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
  return []
  let extrasA = new Set([...keysA].filter(key => !keysB.has(key)));
  let extrasB = new Set([...keysB].filter(key => !keysA.has(key)));
  // let key = on[0];
  // let keyed = {} as {[P in keyof Partial<A & B>]: (A & B)[]};
  // // Start with a.
  // for (let item of a) {
  //   let current = keyed[key];
  //   if (!current) {
  //     keyed[on[0]] = current = [];
  //   }
  //   // Copy because we'll be changing it.
  //   current.push(Object.assign({}, item) as A & B);
  // }
  // // Now add in b.
  // for (let item of b) {
  //   let current = keyed[key];
  //   if (!current) {
  //     keyed[on[0]] = current = [];
  //     current.push()
  //   }
  // }
  // Convert back to array.
  let result = [] as (A & B)[];
  return result;
}
