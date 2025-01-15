const OriginalPromise = Promise;

export class AsyncContext {
  static current: AsyncContext = null

  static get() {
    return this.current;
  }

  static getStackId() {
    return this.current?.id;
  }

  static getId() {
    const currentId = this.current?.id.split('/').filter((el) => el !== '.').pop();
    return currentId;
  }

  static set(ctx: AsyncContext) {
    this.current = ctx;
  }

  static fork(id?: any) {
    const parent = AsyncContext.get();
    const fordId = `${parent?.id || '.'}/${id || '.'}`;
    const fork = new AsyncContext(fordId, parent);
    fork.start();
    return fork
  }

  static run(id: any, callback: Function) {
    const asyncfork = this.fork(id);
    const result = callback();
    asyncfork.reset();
    return result;
  }

  static wrap(id: any, callback: Function) {
    return (...args) => {
      return AsyncContext.run(id, () => callback(...args));
    }
  }

  static assert(id: any) {
    const current = AsyncContext.get();
    if (current.id !== id) {
      console.log('Expected', id, 'but got', current.id);
      throw new Error(`Expected ${id} but got ${current.id}`);
    }
  }

  static assertParent(id: any) {
    const current = AsyncContext.get();
    if (current.parent.id !== id) {
      console.log('Expected Parent', id, 'but got', current.id);
      throw new Error(`Expected Parent ${id} but got ${current.id}`);
    }
  }

  static canLog = false;
  static debug() {
    AsyncContext.canLog = true;
  }

  static endDebug() {
    AsyncContext.canLog = false;
  }

  static log(...args: any[]) {
    if (!AsyncContext.canLog) return;
    console.log(...args);
  }

  id: any;
  parent: AsyncContext;
  constructor(id: any, parent: AsyncContext) {
    this.id = id;
    this.parent = parent;
  }

  start() {
    AsyncContext.set(this);
    AsyncContext.log('start', this.id);
  }
  reset() {
    AsyncContext.set(this.parent);
    AsyncContext.log('reset', this.id, '-> ', this.parent?.id);
  }
}

const PromiseWithContext = function (callback) {
  const fork = AsyncContext.fork()
  const originalPromise = new OriginalPromise((resolve, reject) => {

    const wrapResolve = (...args: any[]) => {
      fork.reset();
      // @ts-ignore
      resolve(...args)
    };

    const wrapReject = (...args) => {
      fork.reset();
      reject(...args)
    };

    // console.log('--- before exec() ----', current?.id)
    callback(wrapResolve, wrapReject);
    // console.log('--- executed() ----', current?.id)
  });


  fork.reset();

  this.then = function (callback) {

    const fork2 = AsyncContext.fork()
    return originalPromise.then((result) => {

      fork2.reset();
      const value = callback(result);
      return value;
    })
  }

  this.catch = function (callback) {
    fork.reset();

    const fork2 = AsyncContext.fork()
    return originalPromise.catch((result) => {
      fork2.reset();

      const value = callback(result);
      return value;
    })
  }

  // Should we keep tracking in finally??
  this.finally = originalPromise.finally.bind(originalPromise);
};

// @ts-ignore
global.Promise = PromiseWithContext;
PromiseWithContext.resolve = OriginalPromise.resolve.bind(PromiseWithContext);
PromiseWithContext.reject = OriginalPromise.reject.bind(PromiseWithContext);
PromiseWithContext.all = OriginalPromise.all.bind(PromiseWithContext);
PromiseWithContext.allSettled = OriginalPromise.allSettled.bind(PromiseWithContext);
PromiseWithContext.any = OriginalPromise.any.bind(PromiseWithContext);
PromiseWithContext.race = OriginalPromise.race.bind(PromiseWithContext);