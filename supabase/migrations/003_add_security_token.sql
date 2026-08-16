-- Migration to add security_token to users table for enhanced security
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS security_token TEXT;
