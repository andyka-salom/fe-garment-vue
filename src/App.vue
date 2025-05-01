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
      <!-- PERBAIKAN: Ambil 'route' dari v-slot dan tambahkan :key -->
      <router-view v-slot="{ Component, route }">
         <transition name="fade" mode="out-in">
              <!-- Gunakan route.path atau route.fullPath sebagai kunci unik -->
              <component :is="Component" :key="route.path" />
         </transition>
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
// Impor yang diperlukan (sudah benar)
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; // Hanya useRouter yang dipakai di script ini
import { useAuthStore } from './stores/auth'; // Sesuaikan path jika perlu

// Impor komponen (sudah benar)
import AppNavbar from './components/AppNavbar.vue';
import AppFooter from './components/AppFooter.vue';
import LoginForm from './components/LoginForm.vue';

const router = useRouter();
const authStore = useAuthStore();

// State untuk modal dan notifikasi (sudah benar)
const showLoginModal = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('info'); // 'info', 'success', 'error', 'warning'
const notificationTimeout = ref(null);

// Computed properties untuk status login dari store (sudah benar)
const isUserLoggedIn = computed(() => authStore.isAuthenticated);
const loggedInUserName = computed(() => authStore.userName);
const loggedInUserRole = computed(() => authStore.userRole);

// Fungsi untuk menampilkan notifikasi (sudah benar)
const displayNotification = (message, type = 'info', duration = 5000) => {
  if (notificationTimeout.value) clearTimeout(notificationTimeout.value);
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  notificationTimeout.value = setTimeout(() => {
    showNotification.value = false;
  }, duration);
};

// Fungsi untuk menutup notifikasi (sudah benar)
const closeNotification = () => {
  if (notificationTimeout.value) clearTimeout(notificationTimeout.value);
  showNotification.value = false;
};

// Fungsi untuk menutup modal login (sudah benar)
const closeLoginModal = () => {
    authStore.clearError(); // Bersihkan error di store saat modal ditutup
    showLoginModal.value = false;
};

// Handler saat login sukses (sudah benar)
const handleLoginSuccess = () => {
  closeLoginModal(); // Tutup modal
  displayNotification(`Login berhasil! Selamat datang, ${authStore.userName || 'Pengguna'}.`, 'success');
  // Arahkan ke dashboard jika belum di sana
   if (router.currentRoute.value.name !== 'dashboard') {
       router.push({ name: 'dashboard' });
   }
};

// Handler saat login error (sudah benar)
const handleLoginError = (errorMessageFromEmit) => {
  // Tampilkan error dari store atau dari emit komponen login
  displayNotification(authStore.error || errorMessageFromEmit || 'Login gagal. Silakan coba lagi.', 'error');
};

// Handler saat logout (sudah benar)
const handleLogout = () => {
  const name = authStore.userName;
  authStore.logout();
  displayNotification(`Anda (${name || 'Pengguna'}) telah berhasil logout.`, 'info');
  router.push('/'); // Kembali ke halaman home
};

// Lifecycle hook onMounted (sudah benar)
onMounted(() => {
  authStore.initializeAuthHeader(); // Inisialisasi header auth saat app mount
  // Hapus log yang tidak perlu di production
  // console.log('App mounted. Auth state initialized.');
  // console.log('Is Authenticated on Mount:', authStore.isAuthenticated);
});
</script>

<style>
/* Global styles & transition styles (Sama seperti sebelumnya, pastikan ada) */
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main-content {
  flex: 1;
  padding-top: 60px; /* Sesuaikan jika navbar fixed */
}
.app-footer { flex-shrink: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- Gaya Notifikasi (Sama seperti sebelumnya) --- */
.notification { position: fixed; top: 70px; right: 20px; padding: 1rem 1.5rem; border-radius: 0.375rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); z-index: 1100; display: flex; align-items: center; justify-content: space-between; min-width: 250px; max-width: 400px; border: 1px solid transparent; }
.notification p { margin: 0; margin-right: 1rem; font-size: 0.9rem; }
.notification--info { background-color: #EFF6FF; color: #1E40AF; border-color: #BFDBFE; }
.notification--success { background-color: #ECFDF5; color: #047857; border-color: #A7F3D0; }
.notification--error { background-color: #FEF2F2; color: #991B1B; border-color: #FECACA; }
.notification--warning { background-color: #FFFBEB; color: #92400E; border-color: #FDE68A; }
.close-notification-btn { background: none; border: none; font-size: 1.4rem; line-height: 1; cursor: pointer; color: inherit; opacity: 0.7; padding: 0 0 0 0.5rem; }
.close-notification-btn:hover { opacity: 1; }

/* --- Gaya Modal Backdrop (Sama seperti sebelumnya) --- */
.modal-backdrop { position: fixed; inset: 0; background-color: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1040; padding: 1rem; }
</style>