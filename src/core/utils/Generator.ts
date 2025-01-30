
export class Generator {
  static isGeneratorFunction(fn: any) {
    const GeneratorFunction = (function* () { yield undefined; }).constructor;
    const isGenerator = fn instanceof GeneratorFunction;
    return isGenerator;
  }

  static execute(generator: Generator, step?: Function) {
    // const generator = generatorFn(...args);
    const executeStep = step ? step : (callback: Function) => callback()

    return new Promise(function (resolve, reject) {
      const generatorStep = (key, arg) => {
        try {
          let info = null

          executeStep(() => {
            info = generator[key](arg)
          });

          if (info.done) {
            resolve(info.value)
          } else {
            Promise.resolve(info.value)
              .then(api.next, api.throw)
          }

        } catch (error) {
          reject(error)
          return
        }
      }

      const api = {
        next: (yielded) => generatorStep("next", yielded),
        throw: (err) => generatorStep("throw", err),
      };

      api.next(undefined)
    })
  }
}