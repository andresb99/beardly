'use client';

import type { ComponentProps } from 'react';
import { Checkbox } from '@heroui/react';
import { Input, Textarea } from '@heroui/input';
import { cn } from '@/lib/cn';
import { mergeSlotClasses } from '@/lib/merge-slot-classes';

type InputClassNames = NonNullable<ComponentProps<typeof Input>['classNames']>;
type TextareaClassNames = NonNullable<ComponentProps<typeof Textarea>['classNames']>;
type CheckboxClassNames = NonNullable<ComponentProps<typeof Checkbox>['classNames']>;

export type SurfaceInputUiVariant = 'default' | 'temporal';
export type SurfaceInputClassNames = InputClassNames;
export type SurfaceTextareaClassNames = TextareaClassNames;
export type SurfaceCheckboxClassNames = CheckboxClassNames;
export type SurfaceInputProps = ComponentProps<typeof Input> & {
  uiVariant?: SurfaceInputUiVariant;
};
export type SurfaceTextareaProps = ComponentProps<typeof Textarea>;
export type SurfaceCheckboxProps = ComponentProps<typeof Checkbox>;

export const surfaceInputClassNames: SurfaceInputClassNames = {
  label: 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate/60 dark:text-slate-400',
  inputWrapper:
    'min-h-[56px] rounded-[1.2rem] border border-white/70 bg-white/72 shadow-[0_18px_24px_-24px_rgba(15,23,42,0.22)] transition data-[hover=true]:border-[hsl(var(--primary)/0.34)] data-[hover=true]:bg-white/84 group-data-[focus=true]:border-[hsl(var(--primary)/0.42)] group-data-[focus=true]:bg-white/88 dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none dark:data-[hover=true]:border-[hsl(var(--primary)/0.22)] dark:data-[hover=true]:bg-white/[0.08] dark:group-data-[focus=true]:border-[hsl(var(--primary)/0.3)] dark:group-data-[focus=true]:bg-white/[0.08]',
  input:
    'text-sm font-medium text-ink placeholder:text-slate/45 dark:text-slate-100 dark:placeholder:text-slate-500',
  description: 'text-xs text-slate/70 dark:text-slate-400',
  errorMessage: 'text-xs text-rose-600 dark:text-rose-300',
};

export const surfaceTemporalInputClassNames: SurfaceInputClassNames = {
  ...surfaceInputClassNames,
  input: cn(surfaceInputClassNames.input, 'temporal-placeholder-hidden'),
};

export const surfaceTextareaClassNames: SurfaceTextareaClassNames = {
  label: surfaceInputClassNames.label,
  inputWrapper: cn(surfaceInputClassNames.inputWrapper, 'py-2'),
  input: cn(surfaceInputClassNames.input, 'resize-y'),
  description: surfaceInputClassNames.description,
  errorMessage: surfaceInputClassNames.errorMessage,
};

export const surfaceCheckboxClassNames: SurfaceCheckboxClassNames = {
  base: 'group inline-flex max-w-fit items-center gap-2',
  wrapper:
    'before:border before:border-white/65 before:bg-white/78 before:shadow-none group-data-[hover=true]:before:border-[hsl(var(--primary)/0.34)] group-data-[selected=true]:before:border-[hsl(var(--primary))] group-data-[selected=true]:before:bg-[hsl(var(--primary))] dark:before:border-white/12 dark:before:bg-white/[0.05] dark:group-data-[hover=true]:before:border-[hsl(var(--primary)/0.34)] dark:group-data-[selected=true]:before:border-[hsl(var(--primary))] dark:group-data-[selected=true]:before:bg-[hsl(var(--primary))]',
  label: 'text-sm font-medium text-ink dark:text-slate-100',
  icon: 'text-white',
};

export function SurfaceInput({ uiVariant = 'default', classNames, ...props }: SurfaceInputProps) {
  const inputClassNames =
    uiVariant === 'temporal' ? surfaceTemporalInputClassNames : surfaceInputClassNames;

  return <Input {...props} classNames={mergeSlotClasses(inputClassNames, classNames)} />;
}

export function SurfaceTextarea({ classNames, ...props }: SurfaceTextareaProps) {
  return (
    <Textarea {...props} classNames={mergeSlotClasses(surfaceTextareaClassNames, classNames)} />
  );
}

export function SurfaceCheckbox({ classNames, ...props }: SurfaceCheckboxProps) {
  return (
    <Checkbox
      {...props}
      radius="sm"
      size="sm"
      classNames={mergeSlotClasses(surfaceCheckboxClassNames, classNames)}
    />
  );
}
