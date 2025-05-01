<template>
  <div class="dashboard-view">
    <div class="container">
      <!-- Title -->
      <h1 class="dashboard-title">Selamat Datang di Dashboard!</h1>

      <div v-if="isAuthenticated && loggedInUser" class="user-info-section">
        <p class="welcome-message">
          Halo, <strong>{{ loggedInUserName || 'Pengguna' }}</strong>!
          Anda login sebagai <strong>{{ loggedInUserRole || 'User' }}</strong>.
        </p>

        <div class="dashboard-widgets">
          <div class="widget-card card">
            <h3>Ringkasan Akun</h3>
            <p>Informasi dasar dan preferensi Anda.</p>
            <ul>
              <li>Email: {{ userEmail || 'Tidak tersedia' }}</li>
              <li>Tema: {{ userPreferences?.theme || 'Default' }}</li>
              <li>Bahasa: {{ userPreferences?.language || 'id' }}</li>
            </ul>
          </div>

          <div class="widget-card card">
            <h3>Akses Cepat</h3>
            <ul v-if="Array.isArray(userMenus) && userMenus.length > 0">
              <li v-for="menu in userMenus" :key="menu.id || menu.name">
                <router-link :to="menu.route || '/'">{{ menu.name || 'Menu Item' }}</router-link>
              </li>
            </ul>
            <p v-else>Tidak ada menu akses cepat yang tersedia untuk peran Anda.</p>
          </div>

          <div class="widget-card card">
            <h3>Notifikasi</h3>
            <p>Belum ada notifikasi baru untuk Anda.</p>
          </div>
        </div>

      </div>
      <div v-else class="error-loading">
        <p>Anda tidak diautentikasi atau data pengguna tidak dapat dimuat.</p>
        <p>Pastikan Anda sudah login melalui halaman utama.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
const authStore = useAuthStore();
// Checks if the user is authenticated based on the store's state
const isAuthenticated = computed(() => authStore.isAuthenticated);
// Gets the entire user object from the store reactively
const loggedInUser = computed(() => authStore.user);

// Specific user details derived from the 'loggedInUser' computed property
const loggedInUserName = computed(() => loggedInUser.value?.name || 'Pengguna');
const loggedInUserRole = computed(() => loggedInUser.value?.role || 'User');
const userEmail = computed(() => loggedInUser.value?.email);
const userPreferences = computed(() => loggedInUser.value?.preferences || {});

onMounted(() => {
  console.log('DashboardView mounted.');
  console.log('Current auth state (Pinia):', isAuthenticated.value);
  console.log('Current user data (Pinia):', loggedInUser.value);


  if (!isAuthenticated.value) {
      console.warn("DashboardView: User is not authenticated according to Pinia store on mount. Router guard might need review if this happens frequently.");
      const router = useRouter();
      router.replace({ name: '/' });
  }
});

</script>
