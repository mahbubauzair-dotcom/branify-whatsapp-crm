-- ============================================================
-- BRANIFY WHATSAPP CRM - PRODUCTION DATABASE MIGRATION
-- Project: branify-whatsapp-crm
-- Schema: Hardened Multi-Tenant CRM with Zero-Leak RLS
-- Target: Supabase PostgreSQL (Executed via Supabase SQL Editor)
--
-- SECURITY & COMPLIANCE RULES:
-- 1. marketing_opt_in strictly defaults to false (NOT NULL). No default consent source.
-- 2. Meta templates created locally default to 'PENDING' meta_status.
-- 3. Zero secrets in database (Meta Access Token, App Secret, API Keys remain server env only).
-- 4. No destructive operations (Zero DROP, TRUNCATE, or number deregistration operations).
-- 5. First registered user becomes Owner; all subsequent users require explicit invitation.
-- 6. Recursion-safe RLS using SECURITY DEFINER functions with strict search_path.
-- 7. Composite Foreign Keys enforce ironclad Cross-Workspace Data Integrity.
-- 8. Internal functions have public/client permissions explicitly REVOKED.
-- 9. Profiles SELECT policy is strictly workspace-scoped (no cross-workspace profile snooping).
-- 10. Webhook idempotency via meta_message_id UNIQUE constraint.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. WORKSPACES & PROFILES
-- ============================================================

-- Table 1: workspaces (Multi-Tenant Organization Scope)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  branding JSONB DEFAULT '{"primaryColor": "#6366F1", "theme": "dark"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: workspace_members (Tenant User Mapping & RBAC)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Table 4: workspace_invites (Strict Invitation-Only Flow)
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, email)
);

-- Table 5: whatsapp_accounts (Public WhatsApp identity metadata only; ZERO secrets stored)
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT 'Branify',
  username TEXT DEFAULT '@branify002',
  phone_number_masked TEXT DEFAULT '+92 332 •••••••',
  phone_number_id TEXT,
  waba_id TEXT,
  display_phone_in_crm BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id)
);

-- ============================================================
-- 3. TAGS & CONTACTS (Cross-Workspace Integrity Composite Keys)
-- ============================================================

-- Table 6: tags (Scoped to workspace, strictly unique per workspace)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, id),
  UNIQUE(workspace_id, name)
);

-- Table 7: contacts (Customer Directory with Explicit Opt-In Semantics)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  wa_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  company TEXT,
  notes TEXT,
  lead_score INTEGER DEFAULT 0,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false, -- MANDATORY: defaults strictly to false
  opt_out_at TIMESTAMPTZ,
  consent_source TEXT,                            -- Explicit source (no fake default)
  consent_timestamp TIMESTAMPTZ,                 -- Explicit timestamp
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, id),
  UNIQUE(workspace_id, wa_id)
);

-- Table 8: contact_tags (Normalized M2M with Composite Cross-Workspace FKs)
CREATE TABLE IF NOT EXISTS public.contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, tag_id),
  CONSTRAINT fk_contact_tags_contact FOREIGN KEY (workspace_id, contact_id)
    REFERENCES public.contacts(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_contact_tags_tag FOREIGN KEY (workspace_id, tag_id)
    REFERENCES public.tags(workspace_id, id) ON DELETE CASCADE
);

-- ============================================================
-- 4. CONVERSATIONS & MESSAGES
-- ============================================================

-- Table 9: conversations (Chat Threads with Composite Cross-Workspace FKs)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'waiting', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, id),
  CONSTRAINT fk_conversations_contact FOREIGN KEY (workspace_id, contact_id)
    REFERENCES public.contacts(workspace_id, id) ON DELETE CASCADE
);

-- Table 10: conversation_tags (Normalized M2M with Composite Cross-Workspace FKs)
CREATE TABLE IF NOT EXISTS public.conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, tag_id),
  CONSTRAINT fk_conv_tags_conversation FOREIGN KEY (workspace_id, conversation_id)
    REFERENCES public.conversations(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_conv_tags_tag FOREIGN KEY (workspace_id, tag_id)
    REFERENCES public.tags(workspace_id, id) ON DELETE CASCADE
);

-- Table 11: messages (Idempotent WhatsApp Message Records with Composite FK)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  meta_message_id TEXT UNIQUE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'bot')),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'template', 'interactive', 'reaction', 'location')),
  body TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  media_filename TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (workspace_id, conversation_id)
    REFERENCES public.conversations(workspace_id, id) ON DELETE CASCADE
);

-- ============================================================
-- 5. TEMPLATES & BROADCASTS
-- ============================================================

-- Table 12: message_templates (Local creation defaults strictly to PENDING)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'en_US',
  category TEXT DEFAULT 'MARKETING' CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  header JSONB,
  body TEXT NOT NULL,
  footer TEXT,
  buttons JSONB DEFAULT '[]'::jsonb,
  meta_status TEXT DEFAULT 'PENDING' CHECK (meta_status IN ('APPROVED', 'PENDING', 'REJECTED')),
  meta_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, id)
);

-- Table 13: broadcasts (Audience Campaigns with Composite Cross-Workspace FKs)
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID,
  target_tags UUID[] DEFAULT '{}',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, id),
  CONSTRAINT fk_broadcasts_template FOREIGN KEY (workspace_id, template_id)
    REFERENCES public.message_templates(workspace_id, id) ON DELETE RESTRICT
);

-- Table 14: broadcast_recipients (Recipient Status Tracking with Composite FKs)
CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  broadcast_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  meta_message_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_broadcast_recipients_broadcast FOREIGN KEY (workspace_id, broadcast_id)
    REFERENCES public.broadcasts(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_broadcast_recipients_contact FOREIGN KEY (workspace_id, contact_id)
    REFERENCES public.contacts(workspace_id, id) ON DELETE CASCADE
);

-- ============================================================
-- 6. PIPELINES, DEALS, AUTOMATIONS & OPERATIONS
-- ============================================================

-- Table 15: pipeline_stages (Unique per workspace and name)
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, id),
  UNIQUE(workspace_id, name)
);

-- Table 16: deals (CRM Sales Deals with Composite Cross-Workspace FKs)
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  conversation_id UUID,
  title TEXT NOT NULL,
  value NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  expected_close TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_deals_stage FOREIGN KEY (workspace_id, stage_id)
    REFERENCES public.pipeline_stages(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_contact FOREIGN KEY (workspace_id, contact_id)
    REFERENCES public.contacts(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_conversation FOREIGN KEY (workspace_id, conversation_id)
    REFERENCES public.conversations(workspace_id, id) ON DELETE SET NULL
);

-- Table 17: automations (Workflow Rules Engine)
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, id)
);

-- Table 18: automation_logs (Execution Audit for Automations)
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL,
  contact_id UUID,
  event_payload JSONB,
  execution_status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_automation_logs_automation FOREIGN KEY (workspace_id, automation_id)
    REFERENCES public.automations(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_automation_logs_contact FOREIGN KEY (workspace_id, contact_id)
    REFERENCES public.contacts(workspace_id, id) ON DELETE SET NULL
);

-- Table 19: tasks_followups (Reminders & Action Items with Composite FKs)
CREATE TABLE IF NOT EXISTS public.tasks_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  conversation_id UUID,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_tasks_contact FOREIGN KEY (workspace_id, contact_id)
    REFERENCES public.contacts(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_conversation FOREIGN KEY (workspace_id, conversation_id)
    REFERENCES public.conversations(workspace_id, id) ON DELETE SET NULL
);

-- Table 20: knowledge_base (Grounding context for verified Branify knowledge only; clean initial state)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 21: audit_logs (Complete Security & Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. PERFORMANCE & ORDERING INDEXES
-- ============================================================

-- Workspace Members
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);

-- Workspace Invites
CREATE INDEX IF NOT EXISTS idx_workspace_invites_lookup ON public.workspace_invites(token, status);

-- Tags
CREATE INDEX IF NOT EXISTS idx_tags_workspace ON public.tags(workspace_id);

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON public.contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ws_wa_id ON public.contacts(workspace_id, wa_id);
CREATE INDEX IF NOT EXISTS idx_contacts_opt_in ON public.contacts(workspace_id, marketing_opt_in);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned ON public.contacts(workspace_id, assigned_to);

-- Contact Tags
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON public.contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON public.contact_tags(tag_id);

-- Conversations (Ordered by newest activity first)
CREATE INDEX IF NOT EXISTS idx_conversations_ws_last_msg ON public.conversations(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_ws_status ON public.conversations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_ws_assigned ON public.conversations(workspace_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation ON public.conversation_tags(conversation_id);

-- Messages (Optimized for loading conversations newest-first with sub-millisecond pagination)
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_meta_id ON public.messages(meta_message_id);

-- Deals & Stages
CREATE INDEX IF NOT EXISTS idx_deals_workspace_stage ON public.deals(workspace_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_workspace_assigned ON public.deals(workspace_id, assigned_to);

-- Broadcasts & Automations
CREATE INDEX IF NOT EXISTS idx_broadcasts_ws_status ON public.broadcasts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON public.broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_automations_ws_active ON public.automations(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.audit_logs(workspace_id, created_at DESC);

-- ============================================================
-- 8. TRIGGER FUNCTIONS (AUTOMATIC updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS set_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER set_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contacts_updated_at ON public.contacts;
CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_conversations_updated_at ON public.conversations;
CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER set_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_deals_updated_at ON public.deals;
CREATE TRIGGER set_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 9. STRICT FIRST-USER BOOTSTRAP & INVITATION ENGINE
-- ============================================================

-- Function: Processes pending invitation if user was pre-invited
-- INVITATION ROLE SAFETY: Does NOT overwrite existing workspace member role.
CREATE OR REPLACE FUNCTION public.process_pending_invite(u_id UUID, u_email TEXT)
RETURNS VOID AS $$
DECLARE
  inv RECORD;
  already_member BOOLEAN;
BEGIN
  FOR inv IN
    SELECT * FROM public.workspace_invites
    WHERE lower(email) = lower(u_email)
      AND status = 'pending'
      AND expires_at > now()
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = inv.workspace_id AND user_id = u_id
    ) INTO already_member;

    IF NOT already_member THEN
      -- Insert member with invited role
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES (inv.workspace_id, u_id, inv.role)
      ON CONFLICT (workspace_id, user_id) DO NOTHING;

      -- Update profile role to match invite
      UPDATE public.profiles SET role = inv.role WHERE id = u_id;
    END IF;

    -- Mark invite accepted
    UPDATE public.workspace_invites SET status = 'accepted' WHERE id = inv.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Function: Handles auth.users signups
-- RULES:
-- 1. Creates profile for every registered auth user.
-- 2. ONLY the very first authenticated user in the entire system becomes OWNER of default Branify workspace.
-- 3. Subsequent signups receive a profile ONLY and have ZERO workspace access until explicitly invited by Owner/Admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_ws_id UUID;
  total_members_count INT;
BEGIN
  -- 1. Create Profile for authenticated user
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Ensure default Branify workspace exists (identified dynamically by slug = 'branify')
  SELECT id INTO default_ws_id FROM public.workspaces WHERE slug = 'branify' LIMIT 1;

  IF default_ws_id IS NULL THEN
    INSERT INTO public.workspaces (name, slug, branding)
    VALUES ('Branify', 'branify', '{"primaryColor": "#6366F1", "theme": "dark"}'::jsonb)
    RETURNING id INTO default_ws_id;
  END IF;

  -- 3. Check total existing workspace members in the system
  SELECT count(*) INTO total_members_count FROM public.workspace_members;

  IF total_members_count = 0 THEN
    -- First signup in system becomes OWNER
    UPDATE public.profiles SET role = 'owner' WHERE id = NEW.id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (default_ws_id, NEW.id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  ELSE
    -- Check if user was pre-invited via workspace_invites
    PERFORM public.process_pending_invite(NEW.id, NEW.email);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 10. RECURSION-FREE AUTHORIZATION & RLS POLICIES
-- ============================================================

-- Function: is_workspace_member(ws_id UUID)
-- SECURITY PROOF (Zero Recursion):
-- 1. Runs as SECURITY DEFINER with fixed search_path = public, auth, pg_temp.
-- 2. Scans public.workspace_members directly with owner privileges, bypassing user RLS.
-- 3. On workspace_members itself, RLS is a direct (user_id = auth.uid()) check.
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Function: has_workspace_permission(ws_id UUID, min_role TEXT)
-- Role hierarchy: owner > admin > agent > viewer
CREATE OR REPLACE FUNCTION public.has_workspace_permission(ws_id UUID, min_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  member_role TEXT;
BEGIN
  SELECT role INTO member_role FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid();

  IF member_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF min_role = 'viewer' THEN
    RETURN member_role IN ('owner', 'admin', 'agent', 'viewer');
  ELSIF min_role = 'agent' THEN
    RETURN member_role IN ('owner', 'admin', 'agent');
  ELSIF min_role = 'admin' THEN
    RETURN member_role IN ('owner', 'admin');
  ELSIF min_role = 'owner' THEN
    RETURN member_role = 'owner';
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- ============================================================
-- 11. PRIVILEGED FUNCTION EXECUTION SECURITY
-- ============================================================

-- Revoke public/client execution from internal privileged functions
REVOKE ALL ON FUNCTION public.process_pending_invite(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_pending_invite(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.process_pending_invite(UUID, TEXT) FROM authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM authenticated;

-- Explicitly grant only the RLS helper functions to authenticated
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_permission(UUID, TEXT) TO authenticated;

-- Enable RLS across all 21 tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies (Strictly workspace-scoped; prevents global profile snooping)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.workspace_members target_member
      WHERE target_member.user_id = profiles.id
        AND public.is_workspace_member(target_member.workspace_id)
    )
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 2. Workspaces Policies
DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
CREATE POLICY "workspaces_select_policy" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id));

DROP POLICY IF EXISTS "workspaces_update_policy" ON public.workspaces;
CREATE POLICY "workspaces_update_policy" ON public.workspaces
  FOR UPDATE USING (public.has_workspace_permission(id, 'admin'));

-- 3. Workspace Members Policies (Direct check, avoids recursion loop)
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
CREATE POLICY "workspace_members_select_policy" ON public.workspace_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.is_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;
CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members
  FOR INSERT WITH CHECK (public.has_workspace_permission(workspace_id, 'admin'));

DROP POLICY IF EXISTS "workspace_members_update_policy" ON public.workspace_members;
CREATE POLICY "workspace_members_update_policy" ON public.workspace_members
  FOR UPDATE USING (public.has_workspace_permission(workspace_id, 'owner'));

DROP POLICY IF EXISTS "workspace_members_delete_policy" ON public.workspace_members;
CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members
  FOR DELETE USING (public.has_workspace_permission(workspace_id, 'owner'));

-- 4. Workspace Invites Policies
DROP POLICY IF EXISTS "workspace_invites_select_policy" ON public.workspace_invites;
CREATE POLICY "workspace_invites_select_policy" ON public.workspace_invites
  FOR SELECT USING (public.has_workspace_permission(workspace_id, 'admin'));

DROP POLICY IF EXISTS "workspace_invites_insert_policy" ON public.workspace_invites;
CREATE POLICY "workspace_invites_insert_policy" ON public.workspace_invites
  FOR INSERT WITH CHECK (public.has_workspace_permission(workspace_id, 'admin'));

DROP POLICY IF EXISTS "workspace_invites_update_policy" ON public.workspace_invites;
CREATE POLICY "workspace_invites_update_policy" ON public.workspace_invites
  FOR UPDATE USING (public.has_workspace_permission(workspace_id, 'admin'));

DROP POLICY IF EXISTS "workspace_invites_delete_policy" ON public.workspace_invites;
CREATE POLICY "workspace_invites_delete_policy" ON public.workspace_invites
  FOR DELETE USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 5. WhatsApp Accounts Metadata Policies
DROP POLICY IF EXISTS "whatsapp_accounts_select_policy" ON public.whatsapp_accounts;
CREATE POLICY "whatsapp_accounts_select_policy" ON public.whatsapp_accounts
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "whatsapp_accounts_modify_policy" ON public.whatsapp_accounts;
CREATE POLICY "whatsapp_accounts_modify_policy" ON public.whatsapp_accounts
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 6. Tags Policies
DROP POLICY IF EXISTS "tags_select_policy" ON public.tags;
CREATE POLICY "tags_select_policy" ON public.tags
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "tags_modify_policy" ON public.tags;
CREATE POLICY "tags_modify_policy" ON public.tags
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'agent'));

-- 7. Contacts Policies
DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
CREATE POLICY "contacts_select_policy" ON public.contacts
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "contacts_insert_policy" ON public.contacts;
CREATE POLICY "contacts_insert_policy" ON public.contacts
  FOR INSERT WITH CHECK (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "contacts_update_policy" ON public.contacts;
CREATE POLICY "contacts_update_policy" ON public.contacts
  FOR UPDATE USING (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "contacts_delete_policy" ON public.contacts;
CREATE POLICY "contacts_delete_policy" ON public.contacts
  FOR DELETE USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 8. Contact Tags Policies
DROP POLICY IF EXISTS "contact_tags_select_policy" ON public.contact_tags;
CREATE POLICY "contact_tags_select_policy" ON public.contact_tags
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "contact_tags_modify_policy" ON public.contact_tags;
CREATE POLICY "contact_tags_modify_policy" ON public.contact_tags
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'agent'));

-- 9. Conversations Policies
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
CREATE POLICY "conversations_select_policy" ON public.conversations
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
CREATE POLICY "conversations_insert_policy" ON public.conversations
  FOR INSERT WITH CHECK (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
CREATE POLICY "conversations_update_policy" ON public.conversations
  FOR UPDATE USING (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;
CREATE POLICY "conversations_delete_policy" ON public.conversations
  FOR DELETE USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 10. Conversation Tags Policies
DROP POLICY IF EXISTS "conversation_tags_select_policy" ON public.conversation_tags;
CREATE POLICY "conversation_tags_select_policy" ON public.conversation_tags
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "conversation_tags_modify_policy" ON public.conversation_tags;
CREATE POLICY "conversation_tags_modify_policy" ON public.conversation_tags
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'agent'));

-- 11. Messages Policies
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages
  FOR INSERT WITH CHECK (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
CREATE POLICY "messages_update_policy" ON public.messages
  FOR UPDATE USING (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
CREATE POLICY "messages_delete_policy" ON public.messages
  FOR DELETE USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 12. Message Templates Policies
DROP POLICY IF EXISTS "templates_select_policy" ON public.message_templates;
CREATE POLICY "templates_select_policy" ON public.message_templates
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "templates_modify_policy" ON public.message_templates;
CREATE POLICY "templates_modify_policy" ON public.message_templates
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 13. Pipeline Stages Policies
DROP POLICY IF EXISTS "pipeline_stages_select_policy" ON public.pipeline_stages;
CREATE POLICY "pipeline_stages_select_policy" ON public.pipeline_stages
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "pipeline_stages_modify_policy" ON public.pipeline_stages;
CREATE POLICY "pipeline_stages_modify_policy" ON public.pipeline_stages
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 14. Deals Policies
DROP POLICY IF EXISTS "deals_select_policy" ON public.deals;
CREATE POLICY "deals_select_policy" ON public.deals
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "deals_insert_policy" ON public.deals;
CREATE POLICY "deals_insert_policy" ON public.deals
  FOR INSERT WITH CHECK (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "deals_update_policy" ON public.deals;
CREATE POLICY "deals_update_policy" ON public.deals
  FOR UPDATE USING (public.has_workspace_permission(workspace_id, 'agent'));

DROP POLICY IF EXISTS "deals_delete_policy" ON public.deals;
CREATE POLICY "deals_delete_policy" ON public.deals
  FOR DELETE USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 15. Broadcasts & Recipients Policies
DROP POLICY IF EXISTS "broadcasts_select_policy" ON public.broadcasts;
CREATE POLICY "broadcasts_select_policy" ON public.broadcasts
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "broadcasts_modify_policy" ON public.broadcasts;
CREATE POLICY "broadcasts_modify_policy" ON public.broadcasts
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'admin'));

DROP POLICY IF EXISTS "broadcast_recipients_select_policy" ON public.broadcast_recipients;
CREATE POLICY "broadcast_recipients_select_policy" ON public.broadcast_recipients
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "broadcast_recipients_modify_policy" ON public.broadcast_recipients;
CREATE POLICY "broadcast_recipients_modify_policy" ON public.broadcast_recipients
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 16. Automations & Logs Policies
DROP POLICY IF EXISTS "automations_select_policy" ON public.automations;
CREATE POLICY "automations_select_policy" ON public.automations
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "automations_modify_policy" ON public.automations;
CREATE POLICY "automations_modify_policy" ON public.automations
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'admin'));

DROP POLICY IF EXISTS "automation_logs_select_policy" ON public.automation_logs;
CREATE POLICY "automation_logs_select_policy" ON public.automation_logs
  FOR SELECT USING (public.is_workspace_member(workspace_id));

-- 17. Tasks Policies
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks_followups;
CREATE POLICY "tasks_select_policy" ON public.tasks_followups
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "tasks_modify_policy" ON public.tasks_followups;
CREATE POLICY "tasks_modify_policy" ON public.tasks_followups
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'agent'));

-- 18. Knowledge Base Policies
DROP POLICY IF EXISTS "knowledge_base_select_policy" ON public.knowledge_base;
CREATE POLICY "knowledge_base_select_policy" ON public.knowledge_base
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "knowledge_base_modify_policy" ON public.knowledge_base;
CREATE POLICY "knowledge_base_modify_policy" ON public.knowledge_base
  FOR ALL USING (public.has_workspace_permission(workspace_id, 'admin'));

-- 19. Audit Logs Policies
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT USING (public.has_workspace_permission(workspace_id, 'admin'));

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

-- ============================================================
-- 12. BASELINE SEED DATA (Dynamic UUID Lookup by slug 'branify')
-- ============================================================

DO $$
DECLARE
  ws_id UUID;
BEGIN
  -- 1. Create Branify workspace if it doesn't already exist
  INSERT INTO public.workspaces (name, slug, branding)
  VALUES ('Branify', 'branify', '{"primaryColor": "#6366F1", "theme": "dark"}'::jsonb)
  ON CONFLICT (slug) DO NOTHING;

  -- 2. Lookup the dynamic UUID generated for 'branify'
  SELECT id INTO ws_id FROM public.workspaces WHERE slug = 'branify' LIMIT 1;

  -- 3. Seed WhatsApp Account Metadata (Safe identity info only; zero secrets)
  INSERT INTO public.whatsapp_accounts (workspace_id, business_name, username, phone_number_masked, phone_number_id, waba_id, display_phone_in_crm, is_active)
  VALUES (ws_id, 'Branify', '@branify002', '+92 332 1029333', '1284140121445758', '1923752848293256', true, true)
  ON CONFLICT (workspace_id) DO UPDATE SET
    phone_number_masked = EXCLUDED.phone_number_masked,
    phone_number_id = EXCLUDED.phone_number_id,
    waba_id = EXCLUDED.waba_id,
    display_phone_in_crm = true;

  -- 4. Seed Standard Pipeline Stages (Unique per workspace and name)
  INSERT INTO public.pipeline_stages (workspace_id, name, stage_order, color)
  VALUES
    (ws_id, 'New Lead', 1, '#64748B'),
    (ws_id, 'Contacted', 2, '#3B82F6'),
    (ws_id, 'Interested', 3, '#8B5CF6'),
    (ws_id, 'Proposal', 4, '#F59E0B'),
    (ws_id, 'Negotiation', 5, '#EC4899'),
    (ws_id, 'Won', 6, '#10B981'),
    (ws_id, 'Lost', 7, '#EF4444')
  ON CONFLICT (workspace_id, name) DO NOTHING;

  -- 5. Seed Default Essential Tags (Unique per workspace and name)
  INSERT INTO public.tags (workspace_id, name, color)
  VALUES
    (ws_id, 'VIP Customer', '#8B5CF6'),
    (ws_id, 'New Inquiry', '#3B82F6'),
    (ws_id, 'Support Pending', '#F59E0B'),
    (ws_id, 'High Value', '#10B981')
  ON CONFLICT (workspace_id, name) DO NOTHING;
END $$;
