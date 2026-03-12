-- Add is_featured flag to projects for landing page showcase
ALTER TABLE public.projects ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
