import React from "react";
import { Entity } from '../models';
import { useForceRender } from '../utils/useForceRender';

interface Type<T> extends Function { 
  new (...args: any[]): T; 
}

export const useEntity = <T extends Entity>(entity: Type<T> | T) : T => {
  const [instance] = React.useState(() => getEntityInstance(entity));
  
  useDetectUsageAndRerenderOnChange(instance);

  return instance;
}

const getEntityInstance = <T extends Entity>(entity: Type<T> | T) : T => {
  const isInstance = entity instanceof Entity;
  if (isInstance) {
    return entity;
  }
  
  const isEntityConstrutor = entity.prototype instanceof Entity;
  if (isEntityConstrutor) {
    const Contructor = entity;
    return new Contructor();
  }
  
  throw new Error('Argument not supprted');
}

const useDetectUsageAndRerenderOnChange = <T extends Entity>(entity: T) => {
  const [ref] = React.useState(() => ({
    current: new Map<object, Set<string | symbol>>(),
    final: new Map<object, Set<string | symbol>>(),
  }));

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
}
