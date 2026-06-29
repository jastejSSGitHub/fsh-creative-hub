-- Asset version history uses existing hub_assets.variant_of (see migration 004).
-- Root assets (variant_of IS NULL) appear on review boards; prior versions are
-- archived as variant rows when editors upload a new version in place.

comment on column public.hub_assets.variant_of is
  'When set, this row is an archived version of the root asset (variant_of target).';
