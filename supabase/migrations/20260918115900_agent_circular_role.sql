-- Enum values must be committed before functions or tables can reference them.
alter type public.user_role add value if not exists 'agent_circular';
