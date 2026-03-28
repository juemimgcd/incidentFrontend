<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { logout, useAuth } from '../../stores/auth'

interface Props {
  eyebrow: string
  title: string
  description: string
}

defineProps<Props>()

const route = useRoute()
const router = useRouter()
const { state } = useAuth()

const navItems = [
  { label: 'Overview', caption: 'Operator snapshot', to: '/app/overview' },
  { label: 'Incidents', caption: 'Search and dispatch', to: '/app/incidents' },
  { label: 'Tasks', caption: 'Execution queue', to: '/app/tasks' },
  { label: 'Teams', caption: 'Ownership and members', to: '/app/teams' },
  { label: 'Notifications', caption: 'Unread activity', to: '/app/notifications' },
]

const userInitials = computed(() => {
  const email = state.profile?.email ?? 'ID'
  return email.slice(0, 2).toUpperCase()
})

function handleLogout() {
  logout()
  router.push('/auth')
}
</script>

<template>
  <div class="workspace-shell">
    <aside class="workspace-nav">
      <div class="workspace-nav__brand">
        <div class="workspace-nav__brand-mark">ID</div>
        <div>
          <p class="workspace-nav__eyebrow">Incident Frontend</p>
          <h1>Dispatch Desk</h1>
        </div>
      </div>

      <nav class="workspace-nav__links" aria-label="Primary">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="workspace-nav__link"
          :class="{ 'workspace-nav__link--active': route.path === item.to }"
        >
          <span class="workspace-nav__link-label">{{ item.label }}</span>
          <span class="workspace-nav__link-caption">{{ item.caption }}</span>
        </RouterLink>
      </nav>

      <div class="workspace-nav__footer">
        <div class="workspace-nav__profile">
          <div class="workspace-nav__avatar">{{ userInitials }}</div>
          <div>
            <p class="workspace-nav__footer-label">Signed in as</p>
            <strong>{{ state.profile?.email ?? 'Guest' }}</strong>
          </div>
        </div>
        <button type="button" class="button button--ghost button--full" @click="handleLogout">
          Sign out
        </button>
      </div>
    </aside>

    <div class="workspace-panel">
      <header class="workspace-header">
        <div>
          <p class="workspace-header__eyebrow">{{ eyebrow }}</p>
          <h2>{{ title }}</h2>
          <p class="workspace-header__description">{{ description }}</p>
        </div>
        <div class="workspace-header__actions">
          <slot name="toolbar" />
        </div>
      </header>

      <main class="workspace-content">
        <slot />
      </main>
    </div>
  </div>
</template>
