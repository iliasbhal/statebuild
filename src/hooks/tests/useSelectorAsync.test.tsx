import * as testingLib from '@testing-library/react-hooks'
import { State, useSelectorAsync } from '../..';

describe('useSelectorAsync', () => {
  it('should return async selector value and state', async () => {
    const count = State.from(3);
    const delayDouble = State.select(async () => {
      const double = count.get() * 2;
      await new Promise(r => setTimeout(r, 100));
      return double;
    })

    const wrapper = testingLib.renderHook(() => useSelectorAsync(delayDouble));

    expect(wrapper.result.current).toMatchObject([null,{ 
      isLoading: true,
      error: null,
    }]);

    await wrapper.waitForNextUpdate();

    expect(wrapper.result.current).toMatchObject([6, { 
      isLoading: false,
      error: null,
    }]);
  })

  it('should render updated selector value', async () => {
    const count = State.from(3);
    const delayDouble = State.select(async () => {
      const double = count.get() * 2;
      await new Promise(r => setTimeout(r, 100));
      return double;
    })

    const wrapper = testingLib.renderHook(() => useSelectorAsync(delayDouble));

    expect(wrapper.result.current).toMatchObject([null,{ 
      isLoading: true,
      error: null,
    }]);

    await wrapper.waitForNextUpdate();

    expect(wrapper.result.current).toMatchObject([6, { 
      isLoading: false,
      error: null,
    }]);

    count.set(1);

    await wrapper.waitForNextUpdate();

    expect(wrapper.result.current).toMatchObject([6,{ 
      isLoading: true,
      error: null,
    }]);

    await wrapper.waitForNextUpdate();

    expect(wrapper.result.current).toMatchObject([2,{ 
      isLoading: false,
      error: null,
    }]);
    
  })
})