// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DashboardView from '../views/DashboardView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import RoleManagementView from '../views/RoleManagementView.vue';
import ProductManagementView from '../views/ProductManagementView.vue';
// --- TAMBAHKAN IMPORT INI ---
import CategoryManager from '../views/CategoryManager.vue'; // Pastikan path ini benar

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
  // --- MASTER ROUTES ---
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
  // --- TAMBAHKAN RUTE BARU DI SINI ---
  {
    path: '/categories', // URL yang akan digunakan
    name: 'category-management', // Nama unik untuk route
    component: CategoryManager, // Komponen yang akan ditampilkan
    meta: { requiresAuth: true } // Proteksi rute jika diperlukan
  },
  // --- END MASTER ROUTES ---

  // Rute lain...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'), // Pastikan base URL benar
  routes,
});

// Contoh Navigation Guard sederhana
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  // Cek sumber autentikasi Anda (misal: localStorage, Vuex store, Pinia store)
  const isAuthenticated = !!localStorage.getItem('authToken'); // Ganti dengan logika cek login Anda

  if (requiresAuth && !isAuthenticated) {
    console.warn(`Navigasi ke "${to.path}" diblokir, butuh autentikasi.`);
    // Redirect ke halaman login atau home, tergantung kebutuhan
    // Jika Anda punya halaman login khusus: next({ name: 'login' });
    next({ name: 'home' }); // Redirect ke home jika akses tanpa login
  } else {
    next(); // Lanjutkan navigasi
  }
});

export default router;