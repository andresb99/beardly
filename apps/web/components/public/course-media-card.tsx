'use client';

import Link from 'next/link';
import { Card, CardFooter, CardHeader } from '@heroui/react';
import { ArrowUpRight } from 'lucide-react';
import { MediaShowcase } from '@/components/public/media-showcase';

interface CourseMediaCardProps {
  title: string;
  description: string;
  topLabel: string;
  imageUrls: Array<string | null | undefined>;
  chips: string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function CourseMediaCard({
  title,
  description,
  topLabel,
  imageUrls,
  chips,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: CourseMediaCardProps) {
  return (
    <Card
      isFooterBlurred
      className="data-card h-[24rem] overflow-hidden rounded-[1.9rem] border-0 p-0 shadow-none"
    >
      <CardHeader className="absolute inset-x-0 top-0 z-10 flex-col items-start gap-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">{topLabel}</p>
        <h2 className="line-clamp-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">{title}</h2>
      </CardHeader>

      <MediaShowcase
        alt={`Portada del curso ${title}`}
        images={imageUrls}
        className="h-full w-full"
        fallback={<div className="h-full w-full bg-[linear-gradient(135deg,rgba(14,165,233,0.9),rgba(15,23,42,0.96))]" />}
      />

      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/88 via-slate-950/26 to-slate-950/8" />

      <CardFooter className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/40 px-4 py-4 backdrop-blur-md">
        <div className="flex w-full flex-col gap-3">
          <p className="line-clamp-3 text-sm text-white/72">{description}</p>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-white/72">
            {chips.map((chip) => (
              <span key={chip} className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                {chip}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={primaryHref} className="action-primary inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold">
              {primaryLabel}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link href={secondaryHref} className="action-secondary rounded-full px-4 py-2 text-sm font-semibold">
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
