"use client";

import { useEffect } from "react";

export default function ScrollToTopOnReload() {
  useEffect(() => {
    const navigationEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;

    // Reset only after a full browser reload (for example, F5).
    // Normal in-app navigation and browser back/forward keep their behavior.
    if (navigationEntry?.type !== "reload") {
      return;
    }

    const resetScroll = () => {
      window.scrollTo(0, 0);
    };

    resetScroll();

    // Run once more after the browser's initial restoration pass.
    const frameId = window.requestAnimationFrame(resetScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return null;
}
