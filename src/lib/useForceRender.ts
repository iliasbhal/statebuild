import React from 'react';

export const useForceRender = () => {
  const [_, setState] = React.useState({});

  const rerender = React.useCallback(() => setState({}), []);
  return rerender;
}