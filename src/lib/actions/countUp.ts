import type { Action } from 'svelte/action';

interface CountUpOptions {
  target:    number;
  duration?: number; // ms
  suffix?:   string;
  delay?:    number; // ms before starting
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

export const countUp: Action<HTMLElement, CountUpOptions> = (node, options) => {
  const { target, duration = 1400, suffix = '', delay = 0 } = options;

  let frame: number;

  function run() {
    const start = Date.now();
    function tick() {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOutQuart(progress) * target);
      node.textContent = `${value}${suffix}`;
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }

  const timer = setTimeout(run, delay);

  return {
    destroy() {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    },
  };
};
