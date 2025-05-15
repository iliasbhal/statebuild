import React from 'react';
import { Selector } from '../../core';

const wrappedByOriginal = new WeakMap();

export const STATEBUILD_UI_FLAG = '__STATEBUILD_UI__';

const originalCreateElement = React.createElement;

const wrapToAutoRerender = (component) => {
  const wrapped = wrappedByOriginal.get(component)
  if (wrapped) return wrapped;

  const wrapped2 = (props) => {
    const[ _, rerender] = React.useState();

    const selector = new Selector(() => {
      return component(props);
  })

    const rendered = selector.get()

    React.useEffect(() => {
      selector.onInvalidate(() => {
        rerender({});
      })
 
      return () => {
        selector.dispose();
      };
    });

    return rendered;
  };

  wrappedByOriginal.set(component, wrapped2);
  return wrapped2;
}

export const enableAutoRendering = () => {

  React.createElement = (component, props, ...children) => {

    const patchedChildren = children.map((child) => {
      const isRenderableEntity = child[STATEBUILD_UI_FLAG];
      if (isRenderableEntity) {
        return child[STATEBUILD_UI_FLAG];
      }

      return child;
    })

    const isRenderableEntity = component[STATEBUILD_UI_FLAG];
    if (isRenderableEntity) {
      return component[STATEBUILD_UI_FLAG];
    }

    if (typeof component !== 'function' || component['$$typeof']) {
      return originalCreateElement(component, props, ...patchedChildren);
    }

    const autoRerenderComp = wrapToAutoRerender(component);
    return originalCreateElement(autoRerenderComp, props, ...patchedChildren);
  }
};