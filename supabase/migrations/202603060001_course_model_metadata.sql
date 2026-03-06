alter table if exists public.courses
  add column if not exists requires_model boolean not null default false,
  add column if not exists model_categories text[] not null default '{}'::text[];

update public.courses
set model_categories = '{}'::text[]
where model_categories is null;

comment on column public.courses.requires_model is
  'Cuando es true, las sesiones del curso deben abrir convocatoria de modelos.';

comment on column public.courses.model_categories is
  'Categorias visibles en la ficha publica para postulaciones de modelos.';
