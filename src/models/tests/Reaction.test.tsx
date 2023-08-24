import { State, } from '../';

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

  it('can restart triggering reaction', () => {
    const atom = State.from(true);
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    const reaction = State.reaction(reactionSpy);
    reactionSpy.mockClear();
    reaction.stop();
    
    atom.set(false);
    jest.runOnlyPendingTimers();
    expect(reactionSpy).not.toHaveBeenCalled();

    atom.set(true);
    jest.runOnlyPendingTimers();
    expect(reactionSpy).not.toHaveBeenCalled();

    reaction.start();
    jest.runOnlyPendingTimers();
    expect(reactionSpy).toHaveBeenCalledTimes(1);
    reactionSpy.mockClear();

    atom.set(false);
    jest.runOnlyPendingTimers();
    expect(reactionSpy).toHaveBeenCalledTimes(1);
  })
})
