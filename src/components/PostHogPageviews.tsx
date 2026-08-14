import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { track } from '@/lib/analytics';

/**
 * HashRouter no dispara el History API: posthog-js solo captura el $pageview
 * inicial. El resto de pantallas se emiten aquí.
 */
export function PostHogPageviews() {
  const location = useLocation();
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    track('$pageview');
  }, [location.pathname, location.search]);

  return null;
}
