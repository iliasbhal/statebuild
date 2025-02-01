export class MapSet<K, V> {
  map = new Map<K, Set<V>>

  forEach(key: K, callback: (arg: V) => void) {
    return this.map.get(key)?.forEach(callback);
  }

  add(key: K, item: V) {
    const set = this.map.get(key);
    if (!set) {
      const nextSet = new Set<V>();
      this.map.set(key, nextSet);
      return nextSet.add(item);
    }

    return set.add(item);
  }

  has(key: K, item: V) {
    return !!this.map.get(key)?.has(item);
  }

  remove(key: K, item: V) {
    return !!this.map.get(key)?.delete(item)
  }

  delete(key: K) {
    const set = this.map.get(key);
    set?.forEach((v) => set.delete(v));
    return this.map.delete(key)
  }
}
