import { State, } from '../';

describe('Reaction', () => {
  jest.useFakeTimers();

  it('it run when defined', () => {
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    const atom = State.from(true);
    State.reaction(reactionSpy);

    expect(reactionSpy).toHaveBeenCalledTimes(1);
  });

  it('it reruns when dependency is updated', () => {
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    const atom = State.from(true);
    State.reaction(reactionSpy);
    reactionSpy.mockClear();

    atom.set(false);
    jest.runOnlyPendingTimers();
    expect(reactionSpy).toHaveBeenCalledTimes(1);
  });

  it('can stop triggering reactions', () => {
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    const atom = State.from(true);
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
    const reactionSpy = jest.fn().mockImplementation(() => {
      atom.get();
    })

    const atom = State.from(true);
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
