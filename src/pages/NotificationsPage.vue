<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api'
import { formatRelativeTime, shortId } from '../lib/format'
import type { NotificationPublic } from '../types/api'

const loading = ref(true)
const error = ref('')
const unreadOnly = ref(false)
const notifications = ref<NotificationPublic[]>([])

async function loadNotifications() {
  loading.value = true
  error.value = ''

  try {
    notifications.value = await fetchNotifications(unreadOnly.value ? true : undefined)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to load notifications.'
  } finally {
    loading.value = false
  }
}

async function handleMarkRead(notificationId: string) {
  try {
    await markNotificationRead(notificationId)
    await loadNotifications()
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to mark the notification as read.'
  }
}

async function handleReadAll() {
  try {
    await markAllNotificationsRead()
    await loadNotifications()
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to mark all notifications as read.'
  }
}

onMounted(loadNotifications)
</script>

<template>
  <AppShell
    eyebrow="Activity"
    title="Notifications"
    description="Track incident assignment, comment, and status-change messages without leaving the command surface."
  >
    <template #toolbar>
      <button type="button" class="button button--ghost" @click="unreadOnly = !unreadOnly; loadNotifications()">
        {{ unreadOnly ? 'Show all' : 'Unread only' }}
      </button>
      <button type="button" class="button button--primary" @click="handleReadAll">Mark all as read</button>
    </template>

    <div v-if="error" class="workspace-alert workspace-alert--error">{{ error }}</div>

    <section class="workspace-block">
      <header class="workspace-block__header">
        <div>
          <p class="section-kicker">Feed</p>
          <h3>Message stream</h3>
        </div>
      </header>

      <div v-if="loading" class="surface-empty">Loading notifications...</div>
      <div v-else-if="notifications.length === 0" class="surface-empty">No notifications match this filter.</div>

      <div v-else class="note-list">
        <article v-for="note in notifications" :key="note.id" class="note-list__item">
          <div>
            <strong>{{ note.message }}</strong>
            <p>{{ note.event_type }} on {{ shortId(note.ref_id) }}</p>
          </div>
          <div class="note-list__meta">
            <span class="meta-chip" :class="{ 'meta-chip--strong': note.unread }">
              {{ note.unread ? 'Unread' : 'Read' }}
            </span>
            <small>{{ formatRelativeTime(note.created_at) }}</small>
            <button
              v-if="note.unread"
              type="button"
              class="button button--ghost"
              @click="handleMarkRead(note.id)"
            >
              Mark read
            </button>
          </div>
        </article>
      </div>
    </section>
  </AppShell>
</template>
