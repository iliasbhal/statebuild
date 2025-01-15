import { AsyncContext } from '../src/utils/SimpleAsyncContext';
import wait from 'wait';

// const main = async () => {

const innerCallback = AsyncContext.wrap('Inner', async () => {
  console.log('\t inner start --->', AsyncContext.get()?.id);
  await wait(200);
  console.log('\t inner done <---', AsyncContext.get()?.id);
});

const total = AsyncContext.wrap('Outer', async () => {
  // console.log('outer start --->');
  AsyncContext.assert('Outer');
  await innerCallback();
  AsyncContext.assert('Outer');
  // console.log('after inner', AsyncContext.get()?.id);

  await wait(200);
  AsyncContext.assert('Outer');
  // console.log('outer done  <---', AsyncContext.get()?.id);
  // console.log(' ------ AsyncContext.get()', AsyncContext.get()?.id);
});


console.log('start');
await total();
console.log('end');
// };

// Promise.resolve()
//   .then(() => console.log("START"))
//   .then(() => main())
//   .then(() => console.log("DONE"))
//   .catch((err) => console.log(err, "ERROR"));
