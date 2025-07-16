import { useEffect, useRef } from 'react';

export function useTraceUpdate(props, componentName = 'Composant') {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});
    
    if (Object.keys(changedProps).length > 0) {
      console.log('⭐⭐⭐ Changements de props dans', componentName, ':', changedProps);
    }
    
    prev.current = props;
  });
}