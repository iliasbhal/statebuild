import wait from 'wait';
import { State, } from '../';

describe('Reaction', () => {

  it('it run when defined', () => {
    const atom = State.from(true);
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    State.reaction(reactionSpy);

    expect(reactionSpy).toHaveBeenCalledTimes(1);
  });

  it('it reruns when dependency is updated', () => {
    const atom = State.from(true);
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    State.reaction(reactionSpy);
    reactionSpy.mockClear();

    atom.set(false);
    expect(reactionSpy).toHaveBeenCalledTimes(1);
    reactionSpy.mockClear();

    atom.set(true);
    expect(reactionSpy).toHaveBeenCalledTimes(1);
  });

  it('can stop triggering reactions', () => {
    const atom = State.from(true);
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    const reaction = State.reaction(reactionSpy);
    reactionSpy.mockClear();
    reaction.stop()

    atom.set(false);
    expect(reactionSpy).not.toHaveBeenCalled();

    atom.set(true);
    expect(reactionSpy).not.toHaveBeenCalled();

    reaction.stop()
  })

  it('can stop and restart triggering reaction', async () => {
    const atom = State.from(true);
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    const reaction = State.reaction('testing', reactionSpy);
    expect(reactionSpy).toHaveBeenCalledTimes(1);

    reactionSpy.mockClear();
    reaction.stop();

    atom.set(false);
    expect(reactionSpy).not.toHaveBeenCalled();

    atom.set(true);
    expect(reactionSpy).not.toHaveBeenCalled();

    reactionSpy.mockClear();
    reaction.start();
    expect(reactionSpy).toHaveBeenCalledTimes(1);
    reactionSpy.mockClear();

    atom.set(false);

    expect(reactionSpy).toHaveBeenCalledTimes(1);
    return;
  })

  it('reactions can run into an infinite loop of trigger', () => {

    const atom = State.from(1);
    const reactionSpy = jest.fn().mockImplementation(() => {
      reactionSpy();
      const prev = atom.get();
      atom.set(prev + 1);
    });

    expect(() => State.reaction(reactionSpy))
      .toThrowError('Maximum call stack size exceeded')
  })


  it.only('can react to async selector in dependencies', async () => {


    const reactionSpy = jest.fn();
    const passthrough = State.select('Double', async () => {
    
      await wait(100);
      return 10;
    });

    const finalSpy = jest.fn();
    const final = State.select('Final', () => {
      finalSpy();
      const value = passthrough.getSync();
      return value;
    });


    const values = [];
    State.reaction(() => {
      const value = final.get();
      values.push(value);
      // reactionSpy(value)
      // console.log('Reaction', value);
    });

    
    console.log('values',values);

    await wait(1000);

    console.log('values',values);
    // expect(reactionSpy).toHaveBeenNthCalledWith(1, {"error": undefined, "isLoading": true, "value": undefined });
    // expect(reactionSpy).toHaveBeenNthCalledWith(2, {"error": undefined, "isLoading": false, "value": 10});

    // atom.set(4);

    // await wait(100);
  })
})
