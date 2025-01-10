import wait from 'wait';

const main = async () => {

  const waitAndReturn = async (value: number, timeout: number) => {
    await wait(timeout);
    return value;
  }

  const aaa = function* () {
    console.log('\n BEFORE 1');
    const value = yield waitAndReturn(10, 1000);

    console.log('\n BEFORE 2');
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




function executeGeneratorFunction(fn) {
  const generator = fn();

  return new Promise(function (resolve, reject) {
    const generatorStep = (key, arg) => {
      try {
        console.log('step -> just before');
        const info = generator[key](arg)
        const value = info.value
        if (info.done) {
          resolve(value)
          console.log('step -> just after');
        } else {
          Promise.resolve(value).then(_next, _throw)
          console.log('steppp -> just after');
        }

      } catch (error) {
        reject(error)
        return
      }
    }

    const _next = (value) => generatorStep("next", value)
    const _throw = (err) => generatorStep("throw", err)

    _next(undefined)
  })
}