import React from "react";
import { Entity } from './Entity';
import { useForceRender } from './lib/useForceRender';

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
    if (isEntityConstrutor) {
      return new entity()
    }
    
    throw new Error('Argument not supprted');
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

  const registration = Entity.regsiterGlobalListener(entity, (parent, key) => {
    if (!ref.current.has(parent)) {
      ref.current.set(parent, new Set());
    }

    ref.current.get(parent).add(key);
  });

  const forceRender = useForceRender();
  React.useEffect(() => {
    registration.unregister();

    // Stop listening to attribute usage after render
    ref.final = ref.current;
    ref.current = new Map();

    const subscriptions : ReturnType<typeof Entity.changes.subscribe>[] = [];

    ref.final.forEach((props, obj) => {
      const subscription = Entity.changes.subscribe(obj, (prop) => {
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

  return entity;
}
