import type { Action } from 'svelte/action';

interface TiltOptions {
  max?:         number;   // max rotation degrees
  perspective?: number;   // CSS perspective value
  liftY?:       number;   // translateY on hover (px)
}

export const tilt: Action<HTMLElement, TiltOptions | undefined> = (node, options) => {
  const { max = 10, perspective = 700, liftY = 6 } = options ?? {};

  function onMove(e: MouseEvent) {
    const rect = node.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left)  / rect.width  - 0.5; // -0.5 → 0.5
    const yRatio = (e.clientY - rect.top)   / rect.height - 0.5;
    node.style.transition = 'transform 0.08s ease-out';
    node.style.transform  =
      `perspective(${perspective}px) ` +
      `rotateX(${-yRatio * max}deg) ` +
      `rotateY(${xRatio  * max}deg) ` +
      `translateY(-${liftY}px)`;
  }

  function onLeave() {
    node.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
    node.style.transform  = '';
    setTimeout(() => { node.style.transition = ''; }, 600);
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
