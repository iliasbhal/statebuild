import { MultiWeakMap } from '../MultiWeakMap';

describe('lib/MultiWeakMap', () => {
  const map = new MultiWeakMap();
  const key1 = {};
  const key2 = {};
  const key3 = {};

  it('should set value for multiple keys', () => {
    map.mset([key1], "CCC");
    expect(map.mhas(key1)).toEqual(true);
    expect(map.mget(key1)).toEqual('CCC');
    
    map.mset([key1,key2], "BBB");
    expect(map.mhas(key1,key2)).toEqual(true);
    expect(map.mget(key1,key2)).toEqual('BBB');
    
    map.mset([key1,key2,key3], "AAA");
    expect(map.mhas(key1,key2,key3)).toEqual(true);
    expect(map.mget(key1,key2,key3)).toEqual('AAA');
    
    expect(map.mget(key2)).toBeUndefined();
    expect(map.mhas(key2)).toBe(false);
  });

  it('should delete multiple keys', () => {
    map.mdelete(key1, key2);
    expect(map.mhas(key1, key2)).toEqual(false);
    expect(map.mget(key1, key2)).toEqual(undefined);

    expect(map.mhas(key1)).toEqual(true);
    expect(map.mget(key1)).toEqual('CCC');
    expect(map.mhas(key1,key2,key3)).toEqual(true);
    expect(map.mget(key1,key2,key3)).toEqual('AAA');
    expect(map.mget(key2)).toBeUndefined();
    expect(map.mhas(key2)).toBe(false);

    map.mdelete(key1);
    expect(map.mhas(key1,key2)).toEqual(false);
    expect(map.mget(key1,key2)).toEqual(undefined);
    expect(map.mhas(key1)).toEqual(false);
    expect(map.mget(key1)).toEqual(undefined);

    expect(map.mhas(key1,key2,key3)).toEqual(true);
    expect(map.mget(key1,key2,key3)).toEqual('AAA');
    expect(map.mget(key2)).toBeUndefined();
    expect(map.mhas(key2)).toBe(false);
  });

  it('works with no keys', () => {
    expect(map.mhas()).toBe(false);
    
    map.mset([], 'DDD');

    expect(map.mhas()).toBe(true);
    expect(map.mget()).toBe('DDD');

    map.mdelete();

    expect(map.mhas()).toBe(false);
    expect(map.mget()).toBe(undefined);
  })

  it('can override already initiated key tuple', () => {
    map.mset([key1,key2], "BBB");
    map.mset([key1,key2], "222");
    expect(map.mget(key1,key2)).toEqual('222');
  })

  it('can clear all keys', () => {
    expect(map.mhas(key1,key2)).toBe(true);

    map.clear();

    expect(map.mhas(key1,key2,key3)).toEqual(false);
    expect(map.mhas(key1,key2)).toBe(false);
    expect(map.mhas(key1)).toEqual(false);
  })
});
