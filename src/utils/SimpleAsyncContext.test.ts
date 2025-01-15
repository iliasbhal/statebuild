import { AsyncContext } from './SimpleAsyncContext';
import wait from 'wait';

describe('AsyncContext', () => {
  it('sync (scenario 1): should know in which context it is', () => {

    const deepInnerWrapperCallback = () => {
      expect(AsyncContext.getId()).toBe('Inner');
      const value = deepInnerCallback();
      expect(AsyncContext.getId()).toBe('Inner');
      return value
    }
    const deepInnerCallback = AsyncContext.wrap('DeepInner', () => {
      expect(AsyncContext.getId()).toBe('DeepInner');
      return 'DEEP'
    })

    const innerCallback = AsyncContext.wrap('Inner', () => {
      expect(AsyncContext.getId()).toBe('Inner');
      const deep = deepInnerWrapperCallback();
      expect(AsyncContext.getId()).toBe('Inner');
      return 'INNER' + ' ' + deep;
    });

    const silblingCallback = AsyncContext.wrap('Silbling', () => {
      expect(AsyncContext.getId()).toBe('Silbling');
      return 'SILBLING'
    })

    const total = AsyncContext.wrap('Outer', () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const inner = innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return 'OUTER' + ' ' + inner;
    });

    expect(AsyncContext.getId()).toBe(undefined);
    expect(silblingCallback()).toBe('SILBLING');
    expect(AsyncContext.getId()).toBe(undefined);
    expect(total()).toBe('OUTER INNER DEEP');
    expect(AsyncContext.getId()).toBe(undefined);
    expect(silblingCallback()).toBe('SILBLING');
    expect(AsyncContext.getId()).toBe(undefined);
  })

  it('async (scenario 1): should know in which context it is', async () => {
    const innerCallback = AsyncContext.wrap('Inner', () => {
      expect(AsyncContext.getId()).toBe('Inner');
      return 'INNER'
    });

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const value = innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER ${value}`;
    });

    await expect(total()).resolves.toBe('OUTER INNER');
  })

  it('async (scenario 2): should know in which context it is', async () => {

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      await wait(100);
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER`;
    });

    const value = await total();
    expect(value).toBe('OUTER');
  })


  it('async (scenario 3): should know in which context it is', async () => {
    const total = AsyncContext.wrap('Outer', async () => {
      // console.log(AsyncContext.getId());
      expect(AsyncContext.getId()).toBe('Outer');
      await wait(100);
      // console.log(AsyncContext.getId());
      expect(AsyncContext.getId()).toBe('Outer');
      await wait(100);
      // console.log(AsyncContext.getId());
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER`;
    });

    const value = await total();
    expect(value).toBe('OUTER');
  })




  it('async (scenario 4): should know in which context it is', async () => {
    const innerCallback = async () => {
      // console.log('\t -> Inner Content', AsyncContext.getStackId());
      expect(AsyncContext.getId()).toBe('Outer');
      return 'INNER'
    };

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      // console.log('Outer Start')

      // console.log('\t -> Inner Start', AsyncContext.getStackId());
      const value = await innerCallback();


      // console.log('\t -> Inner End', AsyncContext.getStackId());

      expect(AsyncContext.getId()).toBe('Outer');
      // console.log('Outer End');
      return `OUTER ${value}`;
    });


    expect(AsyncContext.getId()).toBe(undefined);

    // console.log('\t -> Before All', AsyncContext.getStackId());
    const value = await total();

    expect(AsyncContext.getId()).toBe(undefined);

    // console.log('\t -> After All', AsyncContext.getStackId());
    expect(value).toBe('OUTER INNER');
  })

  it('async (scenario 5): should know in which context it is', async () => {
    const innerCallback = async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      return 'INNER'
    };

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const value = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value2 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value3 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER ${value} ${value2} ${value3}`;
    });

    expect(AsyncContext.getId()).toBe(undefined);
    await total();
    expect(AsyncContext.getId()).toBe(undefined);
    // expect(value).toBe('OUTER INNER INNER INNER');
  })

  it('async (scenario 6): should know in which context it is', async () => {
    const deepCallback = async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      return 'DEEP'
    }

    const innerCallback = async () => {
      expect(AsyncContext.getId()).toBe('Outer');

      const value = await deepCallback();

      expect(AsyncContext.getId()).toBe('Outer');

      return `INNER ${value}`
    };

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const value = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value2 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value3 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER ${value} ${value2} ${value3}`;
    });

    expect(AsyncContext.getId()).toBe(undefined);
    await total();
    expect(AsyncContext.getId()).toBe(undefined);
  })


  it('async (scenario 7): should know in which context it is', async () => {
    const deepCallback = async () => {
      expect(AsyncContext.getId()).toBe('Outer');

      await wait(100);

      expect(AsyncContext.getId()).toBe('Outer');

      return 'DEEP'
    }

    const innerCallback = async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      await wait(100);
      expect(AsyncContext.getId()).toBe('Outer');

      const value = await deepCallback();

      expect(AsyncContext.getId()).toBe('Outer');
      await wait(100);

      expect(AsyncContext.getId()).toBe('Outer');

      return `INNER ${value}`
    };

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const value = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value2 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value3 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER ${value} ${value2} ${value3}`;
    });

    expect(AsyncContext.getId()).toBe(undefined);
    await total();
    expect(AsyncContext.getId()).toBe(undefined);
  })


  it('async (scenario 8): should know in which context it is', async () => {

    const deepCallback = async () => {
      expect(AsyncContext.getId()).toBe('Inner');
      await wait(100);
      expect(AsyncContext.getId()).toBe('Inner');
      return 'DEEP'
    }

    const innerCallback = AsyncContext.wrap('Inner', async () => {
      expect(AsyncContext.getId()).toBe('Inner');
      await wait(100);
      expect(AsyncContext.getId()).toBe('Inner');
      const value = await deepCallback();
      expect(AsyncContext.getId()).toBe('Inner');
      await wait(100);
      expect(AsyncContext.getId()).toBe('Inner');
      return `INNER ${value}`
    });

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const value = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value2 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value3 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER ${value} ${value2} ${value3}`;
    });

    expect(AsyncContext.getId()).toBe(undefined);
    await total();
    expect(AsyncContext.getId()).toBe(undefined);
  })

  it('async (scenario 9): should know in which context it is', async () => {
    const track1 = AsyncContext.wrap('track1', async () => {
      expect(AsyncContext.getId()).toBe('track1');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track1');
    });

    const track2 = AsyncContext.wrap('track2', async () => {
      expect(AsyncContext.getId()).toBe('track2');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track2');
    });

    expect(AsyncContext.getId()).toBe(undefined);

    track1();
    track2();

    await wait(1000)
    expect(AsyncContext.getId()).toBe(undefined);
  })

  it('async (scenario 9/bis): should know in which context it is', async () => {
    const track1 = AsyncContext.wrap('track1', async () => {
      expect(AsyncContext.getId()).toBe('track1');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track1');
    });

    const track2 = AsyncContext.wrap('track2', async () => {
      expect(AsyncContext.getId()).toBe('track2');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track2');
    });

    expect(AsyncContext.getId()).toBe(undefined);

    track1();
    await wait(30)
    track2();

    await wait(1000)
    expect(AsyncContext.getId()).toBe(undefined);
  })

  it('async (scenario 9/bis/bis): should know in which context it is', async () => {
    const track1 = AsyncContext.wrap('track1', async () => {
      expect(AsyncContext.getId()).toBe('track1');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track1');
    });

    const track2 = AsyncContext.wrap('track2', async () => {
      expect(AsyncContext.getId()).toBe('track2');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track2');
    });

    expect(AsyncContext.getId()).toBe(undefined);

    track1().then(() => {
      expect(AsyncContext.getId()).toBe(undefined);
    });

    await wait(30)
    track2().then(() => {
      expect(AsyncContext.getId()).toBe(undefined);
    });;

    await wait(1000)
    expect(AsyncContext.getId()).toBe(undefined);
  })

  it('async (scenario 9/bis/bis/bis): should know in which context it is', async () => {

    const track1 = AsyncContext.wrap('track1', async () => {
      expect(AsyncContext.getId()).toBe('track1');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track1');
    });

    const track2 = AsyncContext.wrap('track2', async () => {
      expect(AsyncContext.getId()).toBe('track2');
      await wait(100);
      expect(AsyncContext.getId()).toBe('track2');
    });

    expect(AsyncContext.getId()).toBe(undefined);

    let trackedAsyncId = false;
    AsyncContext.run('Random Wrap', async () => {
      track1().then(() => {
        trackedAsyncId = AsyncContext.getId();
      });
    })

    // await wait(30)

    let trackedAsyncId2 = false;
    track2().then(() => {
      trackedAsyncId2 = AsyncContext.getId();
    });;

    await wait(1000)
    expect(trackedAsyncId).toBe('Random Wrap');
    expect(trackedAsyncId2).toBe(undefined);
    expect(AsyncContext.getId()).toBe(undefined);
  })

  it('async (scenario 10): should know in which context it is', async () => {
    const innerCallback = AsyncContext.wrap('Inner', async () => {
      expect(AsyncContext.getId()).toBe('Inner');
      await wait(100);
      expect(AsyncContext.getId()).toBe('Inner');
      await wait(100);
      expect(AsyncContext.getId()).toBe('Inner');
      return `INNER`
    });

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const value = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value2 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value3 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER ${value}`;
    });

    expect(AsyncContext.getId()).toBe(undefined);
    const results = await Promise.all([
      total(),
      total(),
    ]);

    expect(AsyncContext.getId()).toBe(undefined);
    expect(results).toEqual(['OUTER INNER', 'OUTER INNER']);
  })

  it('async (scenario 11): should know in which context it is', async () => {
    const innerCallback = AsyncContext.wrap('Inner', async () => {
      expect(AsyncContext.getId()).toBe('Inner');
      // console.log(AsyncContext.getStackId())
      await wait(100);
      // console.log(AsyncContext.getStackId())
      expect(AsyncContext.getId()).toBe('Inner');
      await wait(100);
      // console.log(AsyncContext.getStackId())
      expect(AsyncContext.getId()).toBe('Inner');
      return `INNER`
    });

    const inner2Callback = AsyncContext.wrap('Inner2', async () => {

      // console.log(AsyncContext.getStackId())
      expect(AsyncContext.getId()).toBe('Inner2');
      await wait(100);
      // console.log(AsyncContext.getStackId())
      expect(AsyncContext.getId()).toBe('Inner2');
      await wait(100);
      // console.log(AsyncContext.getStackId())
      expect(AsyncContext.getId()).toBe('Inner2');
      return `INNER2`
    });

    const total = AsyncContext.wrap('Outer', async () => {
      expect(AsyncContext.getId()).toBe('Outer');
      const value = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value2 = await inner2Callback();
      expect(AsyncContext.getId()).toBe('Outer');
      const value3 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer');
      return `OUTER ${value}`;
    });

    const total2 = AsyncContext.wrap('Outer 2', async () => {
      expect(AsyncContext.getId()).toBe('Outer 2');
      const value = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer 2');
      const value2 = await inner2Callback();
      expect(AsyncContext.getId()).toBe('Outer 2');
      const value3 = await innerCallback();
      expect(AsyncContext.getId()).toBe('Outer 2');
      return `OUTER2 ${value2}`;
    });

    expect(AsyncContext.getId()).toBe(undefined);
    const results = await Promise.all([
      total(),
      total2(),
      total(),
      total2(),
    ]);

    expect(AsyncContext.getId()).toBe(undefined);
    expect(results).toEqual(['OUTER INNER', 'OUTER2 INNER2', 'OUTER INNER', 'OUTER2 INNER2']);
  })
})


