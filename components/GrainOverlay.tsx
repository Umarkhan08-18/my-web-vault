'use client';

import { useEffect, useRef } from 'react';

/**
 * A single tile of noise, generated once and repeated over the page, plus a
 * barely-there vignette. It is what stops a large white field from reading as
 * flat paper: the surface gets a tooth, and the corners fall away slightly.
 */
export function GrainOverlay() {
  const grainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = grainRef.current;
    if (!node) return;

    const S = 180;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = ctx.createImageData(S, S);
    const data = image.data;
    // deterministic mottle — no seed bookkeeping needed for a static tile
    for (let i = 0; i < S * S; i += 1) {
      const v = 108 + Math.random() * 92;
      data[i * 4] = v;
      data[i * 4 + 1] = v;
      data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    node.style.backgroundImage = `url(${canvas.toDataURL('image/png')})`;
  }, []);

  return (
    <>
      <div id="vignette" aria-hidden />
      <div id="grain" ref={grainRef} aria-hidden />
    </>
  );
}
