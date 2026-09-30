-- Enum value must be added in its own transaction before it can be used.
alter type public.point_source_type add value if not exists 'redemption';
