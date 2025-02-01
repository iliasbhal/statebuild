import { Atom } from '../Atom';
import { Entity } from '../base/Entity';
import { Selector } from '../Selector'

export const STATEBUILD_RAW_FLAG = '__STATEBUILD_RAW__';

export const makeCallableSelector = <A extends Selector<any>>(selector: A): A['callback'] & A => {
  const callable = () => selector.get();

  Object.setPrototypeOf(callable, Selector.prototype);
  const callableSelector = Object.assign(callable, selector, {
    get: selector.get.bind(selector),
    [STATEBUILD_RAW_FLAG]: selector,
  });

  const coreAtom = Entity.getBaseObject(selector);
  Entity.originalObjectByProxy.set(callableSelector, coreAtom);
  return callableSelector;
}

export const makeCallableAtom = <A extends Atom<any>>(atom: A) => {
  const callable: () => A['atom']['value'] = () => (atom as any).get();

  Object.setPrototypeOf(callable, Atom.prototype);
  const callableAtom = Object.assign(callable, atom);

  // ensure that "this" value is set correctly
  Object.getOwnPropertyNames(Object.getPrototypeOf(atom))
    .forEach((key) => {
      Object.assign(callable, {
        [key]: atom[key].bind(atom),
      })
    })

  const coreAtom = Entity.getBaseObject(atom);
  Entity.originalObjectByProxy.set(callableAtom, coreAtom);
  return callableAtom;
}