import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { posthog } from '@/lib/posthog';

/** HashRouter no dispara el History API; hay que emitir $pageview a mano. */
export function PostHogPageviews() {
  const location = useLocation();

  useEffect(() => {
    posthog.capture('$pageview');
  }, [location.pathname, location.search]);

  return null;
}
