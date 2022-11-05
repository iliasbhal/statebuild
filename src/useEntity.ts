import React from "react";
import { Entity } from './Entity';

interface Type<T> extends Function { 
  new (...args: any[]): T; 
}

export const useEntity = <T extends Entity>(entity: Type<T> | T) : T => {
  const [instance] = React.useState(() => {
    const isInstance = entity instanceof Entity;
    if (isInstance) {
      return entity;
    }
    
    const isEntityConstrutor = entity.prototype instanceof Entity;
    if (!isEntityConstrutor) {
      throw new Error('Constructor doesn\'t extends Entity');
    }

    return new entity()
  });
  const detector = useDetectPropUsage(instance);
  return detector;
}

const useDetectPropUsage = <T extends Entity>(entity: T) => {
  const usedPropsRef = React.useRef({
    current: new Map<object, Set<string | symbol>>(),
    final: new Map<object, Set<string | symbol>>(),
  });

  const ref = usedPropsRef.current 
  const [proxy] = React.useState(() => {
    return Entity.handlePropRead(entity, (parent, key) => {
      if (!ref.current.has(parent)) {
        ref.current.set(parent, new Set());
      }
  
      ref.current.get(parent).add(key);
    });
  });

  const forceRender = useForceRender();
  React.useEffect(() => {
    // Stop listening to attribute usage after render
    ref.final = ref.current;
    ref.current = new Map();

    const subscriptions : ReturnType<typeof Entity.subscribe>[] = [];

    ref.final.forEach((props, obj) => {
      const subscription = Entity.subscribe(obj, (prop) => {
        const isPropUsed = props.has(prop);
        if (isPropUsed) {
          forceRender();
        }
      });

      subscriptions.push(subscription);
    });

    return () => {
      subscriptions.forEach((sub) => {
        sub.unsubscribe();
      })
    }
  });

  return proxy;
}

const useForceRender = () => {
  const [_, setState] = React.useState({});

  const rerender = React.useCallback(() => setState({}), []);
  return rerender;
}