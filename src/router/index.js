import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth'; // Sesuaikan path jika perlu

// Gunakan Dynamic Imports
const HomeView = () => import('../views/HomeView.vue');
const DashboardView = () => import('../views/DashboardView.vue');
const UserManagementView = () => import('../views/UserManagementView.vue');
const RoleManagementView = () => import('../views/RoleManagementView.vue');
const MaterialManagerView = () => import('../views/MaterialManagerView.vue');
const ProductManagerView = () => import('../views/ProductManagerView.vue');
const NotFoundView = () => import('../views/NotFoundView.vue');

// Definisikan route aplikasi (TANPA Type Annotation TypeScript)
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  // --- MASTER ROUTES ---
  {
    path: '/user-management',
    name: 'user-management',
    component: UserManagementView,
    meta: { requiresAuth: true },
  },
  {
    path: '/role-management',
    name: 'role-management',
    component: RoleManagementView,
    meta: { requiresAuth: true },
  },
  {
    path: '/material-management',
    name: 'material-management',
    component: MaterialManagerView,
    meta: { requiresAuth: true },
  },
  {
    path: '/product-management',
    name: 'product-management',
    component: ProductManagerView,
    meta: { requiresAuth: true },
  },
  // --- END MASTER ROUTES ---

  // Catch-all 404 route - HARUS DIPALING AKHIR
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: NotFoundView,
  }
];

// Buat instance router
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  },
});

// Global navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (!to.matched.length && to.name !== 'NotFound') {
    console.warn(`Router Guard: Route tidak ditemukan untuk "${to.fullPath}". Mengarahkan ke 'NotFound'.`);
    next({ name: 'NotFound', replace: true });
    return;
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = authStore.isAuthenticated;

  if (requiresAuth && !isAuthenticated) {
    console.warn(`Router Guard: Navigasi ke "${to.path}" diblokir. User belum login. Mengarahkan ke 'home'.`);
    next({ name: 'home' });
  } else if (to.name === 'home' && isAuthenticated && from.name !== 'dashboard') {
       console.log(`Router Guard: User sudah login. Mengarahkan dari 'home' ke 'dashboard'.`);
       next({ name: 'dashboard' });
  } else {
    next();
  }
});

// Error Handling Router
router.onError((error, to) => {
  console.error(`Error navigating to ${to.path}:`, error);
});

export default router;