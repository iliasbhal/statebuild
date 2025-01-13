import wait from 'wait';

const main = async () => {

  const waitAndReturn = async (value: number, timeout: number) => {
    console.log('waitAndReturn')
    await wait(timeout);
    return value;
  }

  const aaa = function* () {
    const value = yield waitAndReturn(10, 1000);

    return yield waitAndReturn(value * 2, 1000);
  };

  const called = await executeGeneratorFunction(aaa)
  console.log(called);


};

Promise.resolve()
  .then(() => console.log("START"))
  .then(main)
  .then(() => console.log("DONE"))
  .catch((err) => console.log(err, "ERROR"));




function executeGeneratorFunction(generatorFn) {
  const generator = generatorFn();

  return new Promise(function (resolve, reject) {
    const generatorStep = (key, arg) => {
      try {
        console.log('step -> just before');

        const info = generator[key](arg)
        console.log('step -> just after');

        const value = info.value
        if (info.done) {
          resolve(value)
        } else {
          Promise.resolve(value).then(api.next, api.throw)
        }

      } catch (error) {
        reject(error)
        return
      }
    }

    const api = {
      next: (value) => generatorStep("next", value),
      throw: (err) => generatorStep("throw", err),
    };

    api.next(undefined)
  })
}