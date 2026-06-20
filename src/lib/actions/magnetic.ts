import type { Action } from 'svelte/action';

interface MagneticOptions {
  strength?: number; // 0-1, how much the element moves
  ease?:     number; // spring-back easing duration (ms)
}

export const magnetic: Action<HTMLElement, MagneticOptions | undefined> = (node, options) => {
  const { strength = 0.28, ease = 500 } = options ?? {};

  function onMove(e: MouseEvent) {
    const rect = node.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) * strength;
    const dy   = (e.clientY - cy) * strength;
    node.style.transition = 'transform 0.2s ease-out';
    node.style.transform  = `translate(${dx}px, ${dy}px)`;
  }

  function onLeave() {
    node.style.transition = `transform ${ease}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    node.style.transform  = 'translate(0, 0)';
  }

  node.addEventListener('mousemove',  onMove);
  node.addEventListener('mouseleave', onLeave);

  return {
    destroy() {
      node.removeEventListener('mousemove',  onMove);
      node.removeEventListener('mouseleave', onLeave);
    },
  };
};
