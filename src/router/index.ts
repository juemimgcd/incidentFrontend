import { createRouter, createWebHistory } from 'vue-router'
import { ensureAuthReady, useAuth } from '../stores/auth'
import AuthPage from '../pages/AuthPage.vue'
import IncidentsPage from '../pages/IncidentsPage.vue'
import NotificationsPage from '../pages/NotificationsPage.vue'
import OverviewPage from '../pages/OverviewPage.vue'
import TasksPage from '../pages/TasksPage.vue'
import TeamsPage from '../pages/TeamsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/app/overview',
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthPage,
    },
    {
      path: '/app',
      redirect: '/app/overview',
    },
    {
      path: '/app/overview',
      name: 'overview',
      component: OverviewPage,
    },
    {
      path: '/app/incidents',
      name: 'incidents',
      component: IncidentsPage,
    },
    {
      path: '/app/tasks',
      name: 'tasks',
      component: TasksPage,
    },
    {
      path: '/app/teams',
      name: 'teams',
      component: TeamsPage,
    },
    {
      path: '/app/notifications',
      name: 'notifications',
      component: NotificationsPage,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/app/overview',
    },
  ],
})

router.beforeEach(async (to) => {
  await ensureAuthReady()
  const { state, isAuthenticated } = useAuth()

  if (to.path.startsWith('/app') && !isAuthenticated.value) {
    return {
      path: '/auth',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.path === '/auth' && isAuthenticated.value && state.profile) {
    return '/app/overview'
  }

  return true
})

export default router
