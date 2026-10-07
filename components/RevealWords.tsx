import { Fragment, type CSSProperties } from 'react';

/**
 * Splits display type into per-word masks so a headline arrives at reading
 * pace instead of appearing all at once.
 *
 * The original sentence stays on the element as an accessible label, and the
 * visual words are aria-hidden duplicates — screen readers read the phrase
 * once, not one letter at a time.
 *
 * Nothing here is hidden unless the document carries `.js-motion`, so a
 * no-JS render shows the plain sentence.
 */
export function RevealWords({
  text,
  className = '',
  delayBase = 0,
  step = 68,
}: {
  text: string;
  className?: string;
  delayBase?: number;
  step?: number;
}) {
  const words = text.split(' ').filter(Boolean);

  return (
    <span className={`word-reveal ${className}`} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {i > 0 ? ' ' : null}
          <span className="word-mask" aria-hidden="true">
            <span
              className="word"
              style={{ '--word-delay': `${delayBase + i * step}ms` } as CSSProperties}
            >
              {word}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}

/** A single line that uncovers from beneath its own mask. */
export function MaskLine({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={`mask-line ${className}`} data-rv="fade">
      <span style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</span>
    </span>
  );
}
