<template>
  <nav class="nav-items">
    <router-link to="/inbox" class="nav-item" active-class="active">
      <span class="icon">📥</span>
      <span>{{ $t('nav.inbox') }}</span>
    </router-link>
    <router-link to="/today" class="nav-item" active-class="active">
      <span class="icon">☀️</span>
      <span>{{ $t('nav.today') }}</span>
    </router-link>
    <router-link to="/recent" class="nav-item" active-class="active">
      <span class="icon">🕐</span>
      <span>{{ $t('nav.recent') }}</span>
    </router-link>
<router-link to="/completed" class="nav-item" active-class="active">
      <span class="icon">✅</span>
      <span>{{ $t('nav.completed') }}</span>
    </router-link>
    <router-link to="/calendar" class="nav-item" active-class="active">
      <span class="icon">📅</span>
      <span>{{ $t('nav.calendar') }}</span>
    </router-link>
    <router-link to="/notes" class="nav-item" active-class="active">
      <span class="icon">📝</span>
      <span>{{ $t('nav.notes') }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.nav-items {
  padding: var(--spacing-sm) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px var(--spacing-lg);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  letter-spacing: 0.01em;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-active);
  color: var(--accent-primary);
  font-weight: 500;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--accent-primary);
  border-radius: 0 2px 2px 0;
}

.icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}
</style>
