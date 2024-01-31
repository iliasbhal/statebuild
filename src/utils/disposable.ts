export const makeDisposable = <T>(entity: T, dispose: () => void) => {
  // Make return object disposable
  entity[Symbol.for("Symbol.dispose")] = () => dispose();
  return entity as Disposable & T;
}