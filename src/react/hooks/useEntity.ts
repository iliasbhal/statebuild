import React from "react";
import { Entity } from '../../core';
import { useForceRender } from '../../utils/useForceRender';
import { makeDisposable } from "../../utils/disposable";

interface Type<T> extends Function {
  new(...args: any[]): T;
}

export const useEntity = <T extends Entity>(entity: Type<T> | T): T & Disposable => {
  const [instance] = React.useState(() => getEntityInstance(entity));
  return useDetectUsageAndRerenderOnChange(instance);
}

const getEntityInstance = <T extends Entity>(entity: Type<T> | T): T => {
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

const useRegisterListener = <T extends Entity>(entity: T) => {
  const [ref] = React.useState(() => ({
    current: new Map<object, Set<string | symbol>>(),
    final: new Map<object, Set<string | symbol>>(),
    disposed: false,
  }));

  // Reset & Setup listener to detect usage
  ref.disposed = false;
  // const listener = Entity.regsiterGlobalListener(entity, (parent, key) => {
  //   if (!ref.current.has(parent)) {
  //     ref.current.set(parent, new Set());
  //   }

  //   ref.current.get(parent).add(key);
  // });


  const dispose = React.useCallback(() => {
    if (ref.disposed) return;

    // listener.unregister();
    ref.final = ref.current;
    ref.current = new Map();
    ref.disposed = true;
  }, []);

  return {
    // listener,
    dispose,
    getUsedProps: () => {
      return Array.from(ref.final);
    }
  }
}

const useDetectUsageAndRerenderOnChange = <T extends Entity>(entity: T) => {
  const register = useRegisterListener(entity);
  const forceRender = useForceRender();
  React.useEffect(() => {
    register.dispose();
    const subscriptions = register.getUsedProps().map(([obj, props]) => {
      return Entity.subscribe(obj, (prop) => {
        const isPropUsed = props.has(prop);
        if (isPropUsed) {
          forceRender();
        }
      });
    });

    return () => {
      subscriptions.forEach((sub) => {
        sub.unsubscribe();
      })
    }
  });

  return makeDisposable(entity, () => register.dispose());
}



