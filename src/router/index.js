import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DashboardView from '../views/DashboardView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import RoleManagementView from '../views/RoleManagementView.vue';
import ProductManagementView from '../views/ProductManagementView.vue';
import CategoryManager from '../views/CategoryManager.vue';

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
    meta: { requiresAuth: true }
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
  {
    path: '/categories',
    name: 'category-management',
    component: CategoryManager,
    meta: { requiresAuth: true }
  },
  // --- END MASTER ROUTES ---

  // Rute lain...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes,
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = !!localStorage.getItem('authToken');

  if (requiresAuth && !isAuthenticated) {
    console.warn(`Navigasi ke "${to.path}" diblokir, butuh autentikasi.`);
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;