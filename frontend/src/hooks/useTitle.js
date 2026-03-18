import { useEffect } from 'react';

const SANCTUM_SUFFIX = 'House Torkessh Sanctum';
const GARDEN_SUFFIX  = 'The Garden';

export function useTitle(name, section = 'sanctum') {
  const suffix = section === 'garden' ? GARDEN_SUFFIX : SANCTUM_SUFFIX;
  useEffect(() => {
    document.title = name ? `${name} | ${suffix}` : suffix;
    return () => { document.title = suffix; };
  }, [name, suffix]);
}
