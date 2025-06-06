<template>
  <div id="app-container">
    <!-- Area Notifikasi -->
    <div v-if="showNotification"
         class="notification"
         :class="['notification--' + notificationType]"
         role="alert">
      <p>{{ notificationMessage }}</p>
      <button @click="closeNotification" class="close-notification-btn" aria-label="Tutup Notifikasi">×</button>
    </div>

    <!-- Navbar Aplikasi -->
    <AppNavbar
      class="app-navbar"
      @login-click="showLoginModal = true"
      :is-logged-in="isUserLoggedIn"
      :user-name="loggedInUserName"
      :role-name="loggedInUserRole"
      @logout-click="handleLogout"
    />

    <!-- Konten Utama (Router View) -->
    <main class="main-content">
      <router-view v-slot="{ Component, route }">
              <!-- Gunakan route.path atau route.fullPath sebagai kunci unik -->
              <component :is="Component" :key="route.path" />
      </router-view>
    </main>

    <!-- Footer Aplikasi -->
    <AppFooter class="app-footer"/>

    <!-- Modal Login -->
    <div v-if="showLoginModal" class="modal-backdrop" @click.self="closeLoginModal">
      <LoginForm
        @close-modal="closeLoginModal"
        @login-success="handleLoginSuccess"
        @login-error="handleLoginError"
      />
    </div>

  </div>
</template>

<script setup>
// Impor yang diperlukan
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

// Impor komponen
import AppNavbar from './components/AppNavbar.vue';
import AppFooter from './components/AppFooter.vue';
import LoginForm from './components/LoginForm.vue';

const router = useRouter();
const authStore = useAuthStore();

// State untuk modal dan notifikasi
const showLoginModal = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('info'); // 'info', 'success', 'error', 'warning'
const notificationTimeout = ref(null);

// Computed properties untuk status login dari store
const isUserLoggedIn = computed(() => authStore.isAuthenticated);
const loggedInUserName = computed(() => authStore.userName);
const loggedInUserRole = computed(() => authStore.userRole);

// Fungsi untuk menampilkan notifikasi
const displayNotification = (message, type = 'info', duration = 5000) => {
  if (notificationTimeout.value) clearTimeout(notificationTimeout.value);
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  notificationTimeout.value = setTimeout(() => {
    showNotification.value = false;
  }, duration);
};

// Fungsi untuk menutup notifikasi
const closeNotification = () => {
  if (notificationTimeout.value) clearTimeout(notificationTimeout.value);
  showNotification.value = false;
};

// Fungsi untuk menutup modal login
const closeLoginModal = () => {
    authStore.clearError(); // Bersihkan error di store saat modal ditutup
    showLoginModal.value = false;
};

// Handler saat login sukses
const handleLoginSuccess = () => {
  closeLoginModal(); // Tutup modal
  displayNotification(`Login berhasil! Selamat datang, ${authStore.userName || 'Pengguna'}.`, 'success');
  // Arahkan ke dashboard jika belum di sana
   if (router.currentRoute.value.name !== 'dashboard') {
       router.push({ name: 'dashboard' });
   }
};

// Handler saat login error
const handleLoginError = (errorMessageFromEmit) => {
  // Tampilkan error dari store atau dari emit komponen login
  displayNotification(authStore.error || errorMessageFromEmit || 'Login gagal. Silakan coba lagi.', 'error');
};

// Handler saat logout
const handleLogout = () => {
  const name = authStore.userName;
  authStore.logout();
  displayNotification(`Anda (${name || 'Pengguna'}) telah berhasil logout.`, 'info');
  router.push('/'); // Kembali ke halaman home
};

// Lifecycle hook onMounted
onMounted(() => {
  authStore.initializeAuthHeader(); // Inisialisasi header auth saat app mount
  // Hapus log yang tidak perlu di production
  // console.log('App mounted. Auth state initialized.');
  // console.log('Is Authenticated on Mount:', authStore.isAuthenticated);
});
</script>

