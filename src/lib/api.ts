import { getStoredToken } from './session'
import type {
  ApiEnvelope,
  AuthToken,
  CommentPublic,
  IncidentEventPublic,
  IncidentPublic,
  IncidentStatus,
  NotificationPublic,
  TaskPublic,
  TaskStatus,
  TeamMembershipPublic,
  TeamPublic,
  UserAdminPublic,
  UserPublic,
} from '../types/api'

type QueryValue = string | number | boolean | null | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  auth?: boolean
  token?: string | null
  query?: Record<string, QueryValue>
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = API_BASE_URL ? new URL(`${API_BASE_URL}${path}`) : new URL(path, window.location.origin)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue
      }

      url.searchParams.set(key, String(value))
    }
  }

  return url
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  if ('detail' in payload && typeof payload.detail === 'string') {
    return payload.detail
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return fallback
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers()
  const token = options.token ?? (options.auth ? getStoredToken() : null)

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const raw = await response.text()
  const payload = raw ? (JSON.parse(raw) as ApiEnvelope<T> | { detail?: string; message?: string }) : null

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, `${response.status} ${response.statusText}`))
  }

  if (payload && 'code' in payload) {
    if (payload.code !== 0) {
      throw new Error(payload.message || 'Request failed.')
    }

    return payload.data
  }

  return payload as T
}

export function fetchCurrentUser(token?: string) {
  return request<UserPublic>('/api/v1/users/me', { auth: true, token })
}

export function registerUser(email: string, password: string) {
  return request<AuthToken>('/api/v1/users/register', {
    method: 'POST',
    body: { email, password },
  })
}

export function loginUser(email: string, password: string) {
  return request<AuthToken>('/api/v1/users/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function fetchUsers() {
  return request<UserAdminPublic[]>('/api/v1/users', { auth: true })
}

export function fetchIncidents() {
  return request<IncidentPublic[]>('/api/v1/incidents', { auth: true })
}

export function fetchMyIncidents() {
  return request<IncidentPublic[]>('/api/v1/incidents/mine', { auth: true })
}

export function searchIncidents(params: {
  q?: string
  status?: IncidentStatus | ''
  team_id?: string
  assignee_id?: string
  reporter_id?: string
  limit?: number
  offset?: number
}) {
  return request<IncidentPublic[]>('/api/v1/incidents/search', {
    auth: true,
    query: params,
  })
}

export function createIncident(payload: { title: string; description: string; team_id: string }) {
  return request<IncidentPublic>('/api/v1/incidents', {
    method: 'POST',
    auth: true,
    body: payload,
  })
}

export function fetchIncidentDetail(incidentId: string) {
  return request<IncidentPublic>(`/api/v1/incidents/${incidentId}`, { auth: true })
}

export function updateIncidentStatus(incidentId: string, status: IncidentStatus) {
  return request<IncidentPublic>(`/api/v1/incidents/${incidentId}/status`, {
    method: 'PATCH',
    auth: true,
    body: { status },
  })
}

export function assignIncident(incidentId: string, assigneeId: string) {
  return request<IncidentPublic>(`/api/v1/incidents/${incidentId}/assign`, {
    method: 'POST',
    auth: true,
    body: { assignee_id: assigneeId },
  })
}

export function fetchIncidentComments(incidentId: string) {
  return request<CommentPublic[]>(`/api/v1/incidents/${incidentId}/comments`, { auth: true })
}

export function addIncidentComment(incidentId: string, content: string) {
  return request<CommentPublic>(`/api/v1/incidents/${incidentId}/comments`, {
    method: 'POST',
    auth: true,
    body: { content },
  })
}

export function fetchIncidentTimeline(incidentId: string) {
  return request<IncidentEventPublic[]>(`/api/v1/incidents/${incidentId}/timeline`, { auth: true })
}

export function fetchMyTasks() {
  return request<TaskPublic[]>('/api/v1/tasks/mine', { auth: true })
}

export function fetchTasksForIncident(incidentId: string) {
  return request<TaskPublic[]>(`/api/v1/tasks/incident/${incidentId}`, { auth: true })
}

export function createTaskForIncident(
  incidentId: string,
  payload: { title: string; description: string; assignee_id?: string | null },
) {
  return request<TaskPublic>(`/api/v1/tasks/incident/${incidentId}`, {
    method: 'POST',
    auth: true,
    body: payload,
  })
}

export function updateTaskStatus(taskId: string, status: TaskStatus) {
  return request<TaskPublic>(`/api/v1/tasks/${taskId}/status`, {
    method: 'PATCH',
    auth: true,
    body: { status },
  })
}

export function assignTask(taskId: string, assigneeId: string | null) {
  return request<TaskPublic>(`/api/v1/tasks/${taskId}/assign`, {
    method: 'PATCH',
    auth: true,
    body: { assignee_id: assigneeId },
  })
}

export function fetchTeams() {
  return request<TeamPublic[]>('/api/v1/teams', { auth: true })
}

export function createTeam(name: string) {
  return request<TeamPublic>('/api/v1/teams', {
    method: 'POST',
    auth: true,
    body: { name },
  })
}

export function fetchTeamMembers(teamId: string) {
  return request<TeamMembershipPublic[]>(`/api/v1/teams/${teamId}/members`, { auth: true })
}

export function addTeamMember(teamId: string, userId: string, role: 'OWNER' | 'MEMBER') {
  return request<TeamMembershipPublic>(`/api/v1/teams/${teamId}/members`, {
    method: 'POST',
    auth: true,
    body: { user_id: userId, role },
  })
}

export function fetchNotifications(unread?: boolean) {
  return request<NotificationPublic[]>('/api/v1/notifications', {
    auth: true,
    query: unread === undefined ? undefined : { unread },
  })
}

export function markNotificationRead(notificationId: string) {
  return request<null>(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
    auth: true,
  })
}

export function markAllNotificationsRead() {
  return request<null>('/api/v1/notifications/read_all', {
    method: 'POST',
    auth: true,
  })
}
