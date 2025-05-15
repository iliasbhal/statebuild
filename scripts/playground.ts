import * as jest from 'jest';
import { State } from '../src';
import wait from 'wait';

export const main = async () => {


  // const reactionSpy = jest.fn();
  const passthrough = State.select('Double', async () => {
    await wait(100);
    return 10;
  });

  // const finalSpy = jest.fn();
  const final = State.select('Final', () => {
    // finalSpy();
    const value = passthrough.getSync();
    return value;
  });

  // const finalFinalSpy = jest.fn();
  const finalFinal = State.select('FinalFinal', () => {
    // finalFinalSpy();
    const value = final.get();
    return value;
  });


  State.reaction('Reaction', () => {
    const value = finalFinal.get();
    // reactionSpy(value);
  });

  await wait(1000);

  // expect(reactionSpy).toHaveBeenCalledTimes(2);
  // expect(reactionSpy).toHaveBeenNthCalledWith(1, undefined);
  // expect(reactionSpy).toHaveBeenNthCalledWith(2, 10);


};

Promise.resolve()
  .then(() => console.log("START"))
  .then(() => main())
  .then(() => console.log("DONE"))
  .catch((err) => console.log(err, "ERROR"));
