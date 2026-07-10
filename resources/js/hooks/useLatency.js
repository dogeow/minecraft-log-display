import { useEffect, useState } from "react";

export default function useLatency() {
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    let isActive = true;

    const measureLatency = async () => {
      const samples = [];

      for (let i = 0; i < 3; i++) {
        const startedAt = performance.now();
        try {
          await fetch(`/ping?t=${Date.now()}-${i}`, {
            cache: "no-store",
            headers: { "X-Requested-With": "XMLHttpRequest" },
          });
          samples.push(performance.now() - startedAt);
        } catch {
          samples.push(Infinity);
        }
      }

      if (isActive) {
        const average =
          samples.reduce((total, sample) => total + sample, 0) / samples.length;
        setLatency(Math.round(average));
      }
    };

    measureLatency();

    return () => {
      isActive = false;
    };
  }, []);

  return latency;
}
