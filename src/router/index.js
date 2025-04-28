// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DashboardView from '../views/DashboardView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import RoleManagementView from '../views/RoleManagementView.vue';
import ProductManagementView from '../views/ProductManagementView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true } // Contoh meta untuk proteksi rute
  },
  {
    path: '/user-management',
    name: 'user-management',
    component: UserManagementView,
    meta: { requiresAuth: true }
  },
  {
    path: '/role-management',
    name: 'role-management',
    component: RoleManagementView,
    meta: { requiresAuth: true }
  },
  {
    path: '/product-management',
    name: 'product-management',
    component: ProductManagementView,
    meta: { requiresAuth: true }
  },
  // Rute lain...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Contoh Navigation Guard sederhana
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = !!localStorage.getItem('authToken');

  if (requiresAuth && !isAuthenticated) {
    console.warn(`Navigasi ke "${to.path}" diblokir, butuh autentikasi.`);
    next({ name: 'home' }); // Redirect ke home jika akses tanpa login
  } else {
    next(); // Lanjutkan navigasi
  }
});

export default router;
