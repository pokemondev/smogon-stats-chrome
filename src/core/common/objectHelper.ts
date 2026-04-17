export function getMapValues<T>(map: Record<string, T>): T[] {
  return Object.keys(map).map(k => map[k]);
}

export function getMap<T>(sourceObj: Record<string, T>): Map<string, T> {
  const map = new Map<string, T>();
  Object.keys(sourceObj).forEach(key => map.set(key, sourceObj[key]));
  return map;
}

export function groupBy<T, K extends keyof T>(xs: T[], key: K): Record<string, T[]> {
  return xs.reduce<Record<string, T[]>>((rv, x) => {
    const groupKey = String(x[key]);
    (rv[groupKey] = rv[groupKey] || []).push(x);
    return rv;
  }, {});
}

export function areEquals<T extends object>(obj1: T, obj2: T): boolean {
  for (const field of Object.keys(obj1) as Array<keyof T>) {
    const areEquals = obj1[field] === obj2[field];
    if (!areEquals)
      return false;
  }
  return true;
}