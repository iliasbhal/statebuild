class ClearableWeakMap<Key extends object, Value> extends WeakMap<Key, Value> {
  inner = new WeakMap();

  get(key) {
    return this.inner.get(key);
  }

  set(key, value) {
    this.inner.set(key, value);
    return this;
  }

  has(key) {
    return this.inner.has(key);
  }

  delete(key) {
    return this.inner.delete(key);
  }

  clear() {
    this.inner = new WeakMap();
  }
}

export class MultiWeakMap<Key extends object | boolean | string | number | symbol, Value> extends ClearableWeakMap<object, MultiWeakMap<Key, Value>> {
  value: Value;

  mget(...keys: Key[]) {
    let current = this

    for (const key of this.keyloop(keys)) {
      if (!current.has(key)) {
        break;
      }

      current = current.get(key);
    }

    return current.value;
  }

  mset(keys: Key[], value: Value) {
    let current = this

    for (const key of this.keyloop(keys)) {
      if (!current.has(key)) {
        const childMap = new MultiWeakMap();
        current.set(key, childMap);
      }

      current = current.get(key);
    }

    return current.value = value;
  }

  mhas(...keys: Key[]) {
    let current = this

    for (const key of this.keyloop(keys)) {
      if (!current.has(key)) {
        return false;
      }

      current = current.get(key);
    }

    return current.value !== undefined;
  }

  mdelete(...keys: Key[]) { 
    let current = this

    for (const key of this.keyloop(keys)) {
      if (!current.has(key)) {
        return false;
      }

      current = current.get(key);
    }

    delete current.value;
  }

  clear() {
    this.objByPrimitive.clear();
    super.clear();
  }

  protected * keyloop(keys: unknown[]) {
    for (let i = 0; i < keys.length; i++) {
      const key = this.getWeakRef(keys[i]);
      yield key;
    }
  }

  protected objByPrimitive = new Map();
  protected getWeakRef(key: any) : object {
    if (key instanceof Object) {
      return key;
    }

    if (this.objByPrimitive.has(key)) {
      return this.objByPrimitive.get(key)
    }

    const ref = {};
    this.objByPrimitive.set(key, ref);
    return ref;
  }
}