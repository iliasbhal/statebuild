const OriginalPromise = Promise;

export class SimpleAsyncContext {
  static current: SimpleAsyncContext = null

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

  static set(ctx: SimpleAsyncContext) {
    this.current = ctx;
  }

  static fork(id?: any) {
    const parent = SimpleAsyncContext.get();
    const fordId = `${parent?.id || '.'}/${id || '.'}`;
    const fork = new SimpleAsyncContext(fordId, parent);
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
      return SimpleAsyncContext.run(id, () => callback(...args));
    }
  }

  static assert(id: any) {
    const current = SimpleAsyncContext.get();
    if (current.id !== id) {
      console.log('Expected', id, 'but got', current.id);
      throw new Error(`Expected ${id} but got ${current.id}`);
    }
  }

  static assertParent(id: any) {
    const current = SimpleAsyncContext.get();
    if (current.parent.id !== id) {
      console.log('Expected Parent', id, 'but got', current.id);
      throw new Error(`Expected Parent ${id} but got ${current.id}`);
    }
  }

  static canLog = false;
  static debug() {
    SimpleAsyncContext.canLog = true;
  }

  static endDebug() {
    SimpleAsyncContext.canLog = false;
  }

  static log(...args: any[]) {
    if (!SimpleAsyncContext.canLog) return;
    console.log(...args);
  }

  id: any;
  parent: SimpleAsyncContext;
  constructor(id: any, parent: SimpleAsyncContext) {
    this.id = id;
    this.parent = parent;
  }

  start() {
    SimpleAsyncContext.set(this);
    SimpleAsyncContext.log('start', this.id);
  }
  reset() {
    SimpleAsyncContext.set(this.parent);
    SimpleAsyncContext.log('reset', this.id, '-> ', this.parent?.id);
  }
}

const PromiseWithContext = function (callback) {
  const fork = SimpleAsyncContext.fork()
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

    const fork2 = SimpleAsyncContext.fork()
    return originalPromise.then((result) => {

      fork2.reset();
      const value = callback(result);
      return value;
    })
  }

  this.catch = function (callback) {
    fork.reset();

    const fork2 = SimpleAsyncContext.fork()
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