import { State, } from '../';
import { Reaction } from '../Reaction';

describe('Reaction', () => {
  jest.useFakeTimers({ legacyFakeTimers: true });

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
    jest.runOnlyPendingTimers();
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
    jest.runOnlyPendingTimers();
    expect(reactionSpy).not.toHaveBeenCalled();

    atom.set(true);
    jest.runOnlyPendingTimers();
    expect(reactionSpy).not.toHaveBeenCalled();

    reaction.stop()
  })

  it('can restart triggering reaction', async () => {
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

  it('side effect can de defined in an .effect callback that won\'t trigger reactions', () => {

    const atom = State.from(1);
    const reactionSpy = jest.fn().mockImplementation(() => {
      const prev = atom.get();
      console.log('prev',prev)
      Reaction.effect(() => {
        atom.set(prev + 1);
      });
    });

    State.reaction(reactionSpy);    
    expect(reactionSpy).toHaveBeenCalledTimes(1);
    expect(atom.get()).toBe(2);
    reactionSpy.mockClear();

    atom.set(10);
    expect(reactionSpy).toHaveBeenCalledTimes(1);
    expect(atom.get()).toBe(11);
  })

  it('reactions can run into an infinite loop of trigger', () => {

    const atom = State.from(1);
    const reactionSpy = jest.fn().mockImplementation(() => {
      const prev = atom.get();
      atom.set(prev + 1);
    });

    State.reaction(reactionSpy)
    expect(() => atom.set(10))
      .toThrowError('Maximum call stack size exceeded')
  })

})
