// src/router/index.js (or wherever your router is defined)

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DashboardView from '../views/DashboardView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import RoleManagementView from '../views/RoleManagementView.vue';
import ProductManagementView from '../views/ProductManagementView.vue';
import CategoryManager from '../views/CategoryManager.vue';
// ---> ADD THIS IMPORT <---
import ProductionOrderManager from '../views/ProductionOrderManager.vue'; // Adjust path if necessary

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
  // --- MASTER ROUTES ---
  {
    path: '/user-management',
    name: 'user-management',
    component: UserManagementView,
    meta: { requiresAuth: true } // Assuming role check happens inside component or via props
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
  // ---> ADD THIS ROUTE OBJECT <---
  {
    path: '/production-orders', // Define the URL path
    name: 'production-order-management', // Define the route name
    component: ProductionOrderManager, // Link to the imported component
    meta: { requiresAuth: true } // Ensure user must be logged in
  },
  // --- END MASTER ROUTES ---

  // Other routes...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes,
});

// Authentication guard (remains the same)
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  // Get auth status from localStorage (or your preferred method)
  const isAuthenticated = !!localStorage.getItem('authToken'); // Make sure 'authToken' is your correct key

  if (requiresAuth && !isAuthenticated) {
    console.warn(`Navigasi ke "${to.path}" diblokir, butuh autentikasi.`);
    // Optionally store the intended destination to redirect after login
    // localStorage.setItem('intendedRoute', to.fullPath);
    next({ name: 'home' }); // Redirect to home or login page
  } else {
    next(); // Proceed as normal
  }
});

export default router;