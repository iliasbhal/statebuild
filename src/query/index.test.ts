import { QueryClient } from '@tanstack/react-query';
import { QuerySelector } from './index';
import { State } from '../';
import wait from 'wait';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    }
  }
});

describe('Query', () => {
  it('should get the result of the query', async () => {
    const querySelector = QuerySelector.fromOptions({
      client: queryClient,
      queryKey: ['randomKey'],
      queryFn: async () => {
        await wait(100);

        return {
          name: 'OOOOK',
        };
      },
    });

    const spy = jest.fn();
    const reaction = State.reaction(() => {
      const result = querySelector();
      spy(result);
    });


    await wait(300);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0].isLoading).toBe(true);
    expect(spy.mock.calls[1][0].isLoading).toBe(false);
    expect(spy.mock.calls[1][0].data).toEqual({ name: 'OOOOK' });
    reaction.stop();
  });

  it('should get the error of the query', async () => {
    const querySelector = QuerySelector.fromOptions({
      client: queryClient,
      queryKey: ['randomKey 2'],
      queryFn: async () => {
        await wait(100);

        throw new Error('NOT OOOOK');
      },
    });

    const spy = jest.fn();
    const reaction = State.reaction(() => {
      const result = querySelector();
      spy(result);
    });


    await wait(300);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0].isLoading).toBe(true);
    expect(spy.mock.calls[1][0].isError).toBe(true);
    expect(spy.mock.calls[1][0].error).toEqual(new Error('NOT OOOOK'));
    reaction.stop();
  });

  it('should refetch the query when the refetch function is called', async () => {
    const querySpy = jest.fn();
    const querySelector = QuerySelector.fromOptions({
      client: queryClient,
      refetchInterval: 100,
      queryKey: ["randomKey 3"],
      queryFn: async () => {
        querySpy();
        await wait(100);

        return {
          name: 'OOOOK',
        };
      },
    });

    const resultSpy = jest.fn();
    const reaction = State.reaction(() => {
      const result = querySelector();
      resultSpy(result);
    });


    await wait(1000);
    expect(querySpy).toHaveBeenCalledTimes(5);
    reaction.stop();
  })

  it.skip('should rerun when a dependency in the queryFn changes', () => {
    throw new Error('Not implemented')
  });

  it('should stop the query when no longer in use', async () => {
    const querySpy = jest.fn();
    const querySelector = QuerySelector.fromOptions({
      client: queryClient,
      refetchInterval: 100,
      queryKey: ["randomKey 3"],
      queryFn: async () => {
        querySpy();
        await wait(100);

        return {
          name: 'OOOOK',
        };
      },
    });

    const resultSpy = jest.fn();
    const reaction = State.reaction(() => {
      const result = querySelector();
      resultSpy(result);
    });

    await wait(100);

    reaction.stop();
    querySpy.mockClear();

    await wait(1000);
    expect(querySpy).toHaveBeenCalledTimes(0);
  });

})