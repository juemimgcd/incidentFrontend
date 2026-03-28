import type { IncidentStatus, TaskStatus } from '../types/api'

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatRelativeTime(value: string) {
  const date = new Date(value)
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const divisions = [
    { amount: 60, name: 'second' },
    { amount: 60, name: 'minute' },
    { amount: 24, name: 'hour' },
    { amount: 7, name: 'day' },
    { amount: 4.34524, name: 'week' },
    { amount: 12, name: 'month' },
    { amount: Number.POSITIVE_INFINITY, name: 'year' },
  ]
  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

  let duration = seconds

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name as Intl.RelativeTimeFormatUnit)
    }

    duration /= division.amount
  }

  return formatDateTime(value)
}

export function shortId(value: string) {
  return value.length <= 10 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`
}

export function humanizeIncidentStatus(status: IncidentStatus) {
  switch (status) {
    case 'OPEN':
      return 'Open'
    case 'TRIAGED':
      return 'Triaged'
    case 'CLOSED':
      return 'Closed'
    default:
      return status
  }
}

export function humanizeTaskStatus(status: TaskStatus) {
  switch (status) {
    case 'TODO':
      return 'To do'
    case 'DONE':
      return 'Done'
    case 'CANCELED':
      return 'Canceled'
    default:
      return status
  }
}

export function incidentStatusTone(status: IncidentStatus) {
  switch (status) {
    case 'OPEN':
      return 'status-pill--open'
    case 'TRIAGED':
      return 'status-pill--triaged'
    case 'CLOSED':
      return 'status-pill--closed'
  }
}

export function taskStatusTone(status: TaskStatus) {
  switch (status) {
    case 'TODO':
      return 'status-pill--todo'
    case 'DONE':
      return 'status-pill--done'
    case 'CANCELED':
      return 'status-pill--canceled'
  }
}
