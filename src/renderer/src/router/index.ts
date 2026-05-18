import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/inbox' },
    { path: '/inbox', name: 'inbox', component: () => import('@/views/InboxView.vue') },
    { path: '/today', name: 'today', component: () => import('@/views/TodayView.vue') },
    { path: '/recent', name: 'recent', component: () => import('@/views/RecentView.vue') },
    { path: '/completed', name: 'completed', component: () => import('@/views/CompletedView.vue') },
    { path: '/trash', name: 'trash', component: () => import('@/views/TrashView.vue') },
    { path: '/category/:id', name: 'category', component: () => import('@/views/CategoryView.vue'), props: true },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue') },
    { path: '/notes', name: 'notes', component: () => import('@/views/NoteView.vue') },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    { path: '/statistics', name: 'statistics', component: () => import('@/views/StatisticsView.vue') }
  ]
})

export default router
