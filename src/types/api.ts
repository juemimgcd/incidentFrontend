export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface UserPublic {
  id: string
  email: string
  is_active: boolean
}

export interface UserAdminPublic extends UserPublic {
  is_superuser: boolean
}

export type IncidentStatus = 'OPEN' | 'TRIAGED' | 'CLOSED'

export interface IncidentPublic {
  id: string
  title: string
  description: string | null
  status: IncidentStatus
  reporter_id: string
  assignee_id: string | null
  team_id: string
}

export type TaskStatus = 'TODO' | 'DONE' | 'CANCELED'

export interface TaskPublic {
  id: string
  incident_id: string
  creator_id: string | null
  assignee_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface TeamPublic {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface TeamMembershipPublic {
  id: string
  team_id: string
  user_id: string
  role: 'OWNER' | 'MEMBER' | string
  created_at: string
  updated_at: string
}

export interface NotificationPublic {
  id: string
  event_type: string
  ref_type: string
  ref_id: string
  message: string
  unread: boolean
  created_at: string
}

export interface CommentPublic {
  id: string
  incident_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface IncidentEventPublic {
  id: string
  incident_id: string
  actor_id: string | null
  type: string
  payload: Record<string, unknown>
  summary: string | null
  created_at: string
  updated_at: string
}
