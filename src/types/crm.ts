export type UserRole = 'owner' | 'admin' | 'agent' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  branding?: {
    primaryColor: string;
    theme: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppAccount {
  id: string;
  workspace_id: string;
  business_name: string;
  username: string;
  phone_number_masked: string;
  phone_number_id?: string;
  waba_id?: string;
  display_phone_in_crm: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  wa_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
  lead_score: number;
  marketing_opt_in: boolean;
  opt_out_at: string | null;
  consent_source: string | null;
  consent_timestamp: string | null;
  assigned_to: string | null;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export type ConversationStatus = 'open' | 'pending' | 'waiting' | 'resolved' | 'closed';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Conversation {
  id: string;
  workspace_id: string;
  contact_id: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  assigned_to: string | null;
  unread_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  tags?: Tag[];
  last_message?: Message;
}

export type MessageSenderType = 'customer' | 'agent' | 'system' | 'bot';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'template' | 'interactive' | 'reaction' | 'location';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  workspace_id: string;
  conversation_id: string;
  meta_message_id?: string | null;
  sender_type: MessageSenderType;
  sender_id?: string | null;
  message_type: MessageType;
  body: string | null;
  media_url?: string | null;
  media_mime_type?: string | null;
  media_filename?: string | null;
  status: MessageStatus;
  error_details?: Record<string, any> | null;
  created_at: string;
}

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateMetaStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface MessageTemplate {
  id: string;
  workspace_id: string;
  name: string;
  language: string;
  category: TemplateCategory;
  header_type?: string | null;
  header_content?: string | null;
  body: string;
  footer_content?: string | null;
  status: TemplateMetaStatus;
  meta_template_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type BroadcastStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';

export interface Broadcast {
  id: string;
  workspace_id: string;
  name: string;
  template_id: string | null;
  target_tags?: string[];
  total_recipients: number;
  successful_sends: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  status: BroadcastStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  template?: MessageTemplate;
}

export interface PipelineStage {
  id: string;
  workspace_id: string;
  name: string;
  stage_order: number;
  color: string;
  created_at: string;
}

export interface Deal {
  id: string;
  workspace_id: string;
  stage_id: string;
  contact_id: string;
  conversation_id: string | null;
  title: string;
  value: number;
  currency?: string;
  expected_close?: string | null;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  stage?: PipelineStage;
}

export interface AutomationRule {
  id: string;
  workspace_id: string;
  name: string;
  trigger_type: string;
  trigger_config?: Record<string, any>;
  action_type: string;
  action_config?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Automation = AutomationRule;

export interface AutomationLog {
  id: string;
  workspace_id: string;
  automation_id?: string;
  contact_id?: string | null;
  trigger_event?: string;
  status: string;
  details?: Record<string, any> | null;
  executed_at: string;
}

export interface TaskFollowup {
  id: string;
  workspace_id: string;
  contact_id?: string | null;
  conversation_id?: string | null;
  title: string;
  due_date: string;
  assigned_to?: string | null;
  status: 'pending' | 'completed' | 'overdue';
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

export interface KnowledgeBaseItem {
  id: string;
  workspace_id: string;
  category: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  changes?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}
