export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      agency_info: {
        Row: { id: string; name: string; owner: string; description: string | null; created_at: string }
        Insert: { id?: string; name: string; owner: string; description?: string | null; created_at?: string }
        Update: { id?: string; name?: string; owner?: string; description?: string | null }
      }
      team_members: {
        Row: { id: string; name: string; email: string; role: 'owner' | 'manager' | 'user'; status: 'active' | 'inactive'; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; email: string; role: 'owner' | 'manager' | 'user'; status?: 'active' | 'inactive' }
        Update: { name?: string; email?: string; role?: 'owner' | 'manager' | 'user'; status?: 'active' | 'inactive' }
      }
      clients: {
        Row: { id: string; name: string; email: string | null; industry: string | null; status: 'active' | 'inactive' | 'prospect'; contact_person: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; email?: string | null; industry?: string | null; status?: 'active' | 'inactive' | 'prospect'; contact_person?: string | null; notes?: string | null }
        Update: { name?: string; email?: string | null; industry?: string | null; status?: 'active' | 'inactive' | 'prospect'; contact_person?: string | null; notes?: string | null }
      }
      projects: {
        Row: { id: string; client_id: string; name: string; status: 'planning' | 'active' | 'completed' | 'paused'; description: string | null; budget: number | null; created_at: string; updated_at: string }
        Insert: { id?: string; client_id: string; name: string; status?: 'planning' | 'active' | 'completed' | 'paused'; description?: string | null; budget?: number | null }
        Update: { client_id?: string; name?: string; status?: 'planning' | 'active' | 'completed' | 'paused'; description?: string | null; budget?: number | null }
      }
      automations: {
        Row: { id: string; name: string; description: string | null; status: 'active' | 'inactive'; trigger_type: 'email' | 'webhook' | 'schedule' | 'manual'; client_id: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; description?: string | null; status?: 'active' | 'inactive'; trigger_type: 'email' | 'webhook' | 'schedule' | 'manual'; client_id?: string | null; notes?: string | null }
        Update: { name?: string; description?: string | null; status?: 'active' | 'inactive'; trigger_type?: 'email' | 'webhook' | 'schedule' | 'manual'; client_id?: string | null; notes?: string | null }
      }
      chat_history: {
        Row: { id: string; user_id: string; message: string; response: string; timestamp: string; metadata: Json }
        Insert: { id?: string; user_id: string; message: string; response: string; timestamp?: string; metadata?: Json }
        Update: { message?: string; response?: string; metadata?: Json }
      }
      decisions_memory: {
        Row: { id: string; decision: string; context: string; impact: string | null; tags: string[]; created_at: string; updated_at: string }
        Insert: { id?: string; decision: string; context: string; impact?: string | null; tags?: string[] }
        Update: { decision?: string; context?: string; impact?: string | null; tags?: string[] }
      }
      pinned_items: {
        Row: { id: string; chat_id: string | null; decision_id: string | null; title: string; created_at: string }
        Insert: { id?: string; chat_id?: string | null; decision_id?: string | null; title: string }
        Update: { title?: string }
      }
      workflow_logs: {
        Row: { id: string; workflow_name: string; execution_id: string; status: 'success' | 'failed' | 'running' | 'paused'; execution_time_ms: number | null; error_message: string | null; timestamp: string }
        Insert: { id?: string; workflow_name: string; execution_id: string; status: 'success' | 'failed' | 'running' | 'paused'; execution_time_ms?: number | null; error_message?: string | null; timestamp?: string }
        Update: { status?: 'success' | 'failed' | 'running' | 'paused'; error_message?: string | null }
      }
      metrics_instagram: {
        Row: { id: string; followers: number; engagement_rate: number | null; top_post: string | null; top_post_likes: number | null; timestamp: string }
        Insert: { id?: string; followers: number; engagement_rate?: number | null; top_post?: string | null; top_post_likes?: number | null }
        Update: never
      }
      metrics_youtube: {
        Row: { id: string; subscribers: number; views: number; avg_watch_time_minutes: number | null; timestamp: string }
        Insert: { id?: string; subscribers: number; views: number; avg_watch_time_minutes?: number | null }
        Update: never
      }
      metrics_tiktok: {
        Row: { id: string; followers: number; engagement_rate: number | null; top_video: string | null; top_video_views: number | null; timestamp: string }
        Insert: { id?: string; followers: number; engagement_rate?: number | null; top_video?: string | null; top_video_views?: number | null }
        Update: never
      }
      actions_log: {
        Row: { id: string; action_type: 'email' | 'api_call' | 'ssh' | 'report' | 'decision' | 'other'; description: string; status: 'pending' | 'executed' | 'failed' | 'canceled'; result: string | null; created_by: string; created_at: string }
        Insert: { id?: string; action_type: 'email' | 'api_call' | 'ssh' | 'report' | 'decision' | 'other'; description: string; status?: 'pending' | 'executed' | 'failed' | 'canceled'; result?: string | null; created_by: string }
        Update: { status?: 'pending' | 'executed' | 'failed' | 'canceled'; result?: string | null }
      }
      servers: {
        Row: { id: string; name: string; host: string; port: number; status: 'online' | 'offline' | 'unreachable'; last_check: string | null; created_at: string }
        Insert: { id?: string; name: string; host: string; port?: number; status?: 'online' | 'offline' | 'unreachable' }
        Update: { name?: string; host?: string; port?: number; status?: 'online' | 'offline' | 'unreachable'; last_check?: string | null }
      }
      email_confirmations: {
        Row: { id: string; action_id: string; token: string; approved_by: string | null; approved_at: string | null; expires_at: string; created_at: string }
        Insert: { id?: string; action_id: string; token: string; approved_by?: string | null; approved_at?: string | null; expires_at: string }
        Update: { approved_by?: string | null; approved_at?: string | null }
      }
      vault_credentials: {
        Row: { id: string; service: string; encrypted_key: string; last_rotated: string }
        Insert: { id?: string; service: string; encrypted_key: string }
        Update: { encrypted_key?: string; last_rotated?: string }
      }
    }
    Views: {
      latest_metrics: {
        Row: { instagram_followers: number | null; instagram_engagement: number | null; youtube_subscribers: number | null; youtube_views: number | null; tiktok_followers: number | null; tiktok_engagement: number | null; snapshot_time: string }
      }
      recent_actions_view: {
        Row: { id: string; action_type: string; description: string; status: string; created_by: string; created_at: string }
      }
      active_automations_view: {
        Row: { id: string; name: string; description: string | null; trigger_type: string; client_name: string | null; status: string; created_at: string }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Client = Tables<'clients'>
export type Project = Tables<'projects'>
export type Automation = Tables<'automations'>
export type TeamMember = Tables<'team_members'>
export type ChatHistory = Tables<'chat_history'>
export type Decision = Tables<'decisions_memory'>
export type ActionLog = Tables<'actions_log'>
export type WorkflowLog = Tables<'workflow_logs'>
export type Server = Tables<'servers'>
export type PinnedItem = Tables<'pinned_items'>
