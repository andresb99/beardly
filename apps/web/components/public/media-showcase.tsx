'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image } from '@heroui/react';
import { cn } from '@/lib/cn';

interface MediaShowcaseProps {
  alt: string;
  images: Array<string | null | undefined>;
  className?: string;
  imageClassName?: string;
  dotsClassName?: string;
  fallback?: ReactNode;
}

export function MediaShowcase({
  alt,
  images,
  className,
  imageClassName,
  dotsClassName,
  fallback = null,
}: MediaShowcaseProps) {
  const normalizedImages = useMemo(
    () =>
      Array.from(
        new Set(
          images
            .map((value) => String(value || '').trim())
            .filter(Boolean),
        ),
      ),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = normalizedImages.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedImages]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {normalizedImages.length > 0 ? (
        normalizedImages.map((imageUrl, index) => (
          <Image
            key={`${imageUrl}-${index}`}
            removeWrapper
            alt={normalizedImages.length > 1 ? `${alt} ${index + 1}` : alt}
            src={imageUrl}
            className={cn(
              'absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-300',
              index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0',
              imageClassName,
            )}
          />
        ))
      ) : (
        fallback
      )}

      {hasMultipleImages ? (
        <div className={cn('absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5', dotsClassName)}>
          {normalizedImages.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-dot-${index}`}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActiveIndex(index);
              }}
              aria-label={`Ver imagen ${index + 1}`}
              className={cn(
                'h-2 w-2 rounded-full border border-white/70 transition-all',
                index === activeIndex ? 'w-5 bg-white' : 'bg-white/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
