import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

if (typeof window !== 'undefined') {
  (window as any)['__vitalsResults'] = (window as any)['__vitalsResults'] || [];
}

type ReportHandler = (metric: Metric | { name: string; value: number }) => void;

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    const collector = (metric: Metric | { name: string; value: number }) => {
      (window as any)['__vitalsResults'].push(metric);
      onPerfEntry(metric);
    };
    onCLS(collector);
    onFCP(collector);
    onLCP(collector);
    onTTFB(collector);
    onINP(collector, { durationThreshold: 0, reportAllChanges: true });

    if (typeof window !== 'undefined' && 'performance' in window) {
      const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (nav) {
        [
          { name: 'domContentLoaded', value: nav.domContentLoadedEventEnd },
          { name: 'domInteractive', value: nav.domInteractive },
        ].forEach((m) => collector(m));
      }
    }
  }
};

export default reportWebVitals;
