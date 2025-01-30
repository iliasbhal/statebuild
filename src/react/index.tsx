import { AnySelectorCallback, State as StateOG } from '../core';
import { makeRenderable } from './utils/makeRenderable';
import { enableAutoRendering } from './utils/enableAutoRendering';

export * from './hooks';

export class State extends StateOG {
  static from<Fn>(selectorFn: Fn): ReturnType<typeof makeRenderable<any, ReturnType<typeof StateOG.from<Fn>>>>;
  static from(a) {
    const atom = StateOG.from(a);
    return makeRenderable(atom);
  }

  static select<Fn extends AnySelectorCallback>(name: string, selectorFn: Fn): ReturnType<typeof makeRenderable<any, ReturnType<typeof StateOG.select<Fn>>>>;
  static select<Fn extends AnySelectorCallback>(selectorFn: Fn, b?: never): ReturnType<typeof makeRenderable<any, ReturnType<typeof StateOG.select<Fn>>>>;
  static select(a, b) {
    const atom = StateOG.select(a, b);
    return makeRenderable(atom);
  }

  static enableAutoRendering = enableAutoRendering;
}
