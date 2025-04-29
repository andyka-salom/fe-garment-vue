<template>
  <div id="app-container">
    <!-- Notification Area -->
    <div v-if="showNotification"
         class="notification"
         :class="['notification--' + notificationType]"
         role="alert">
      <p>{{ notificationMessage }}</p>
      <button @click="closeNotification" class="close-notification-btn" aria-label="Tutup Notifikasi">×</button>
    </div>

    <!-- Navbar -->
    <AppNavbar
      class="app-navbar"
      @login-click="showLoginModal = true"
      :is-logged-in="isUserLoggedIn"
      :user-name="loggedInUserName"
      :role-name="loggedInUserRole"
      @logout-click="handleLogout"
    />

    <!-- Konten Utama (Router View) -->
    <!-- Class 'main-content' ditambahkan untuk styling -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
         <transition name="fade" mode="out-in">
              <component :is="Component" />
         </transition>
      </router-view>
    </main>

    <!-- Footer -->
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// Import komponen
import AppNavbar from './components/AppNavbar.vue';
import AppFooter from './components/AppFooter.vue';
import LoginForm from './components/LoginForm.vue';

const router = useRouter();
const showLoginModal = ref(false);

// State Login
const isUserLoggedIn = ref(false);
const loggedInUserName = ref('');
const loggedInUserRole = ref('');

// State Notifikasi
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('info');
const notificationTimeout = ref(null);

// --- Functions (Tetap sama seperti sebelumnya) ---
const displayNotification = (message, type = 'info', duration = 5000) => {
  if (notificationTimeout.value) clearTimeout(notificationTimeout.value);
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  notificationTimeout.value = setTimeout(() => {
    showNotification.value = false;
  }, duration);
};
const closeNotification = () => {
  if (notificationTimeout.value) clearTimeout(notificationTimeout.value);
  showNotification.value = false;
};
const closeLoginModal = () => { showLoginModal.value = false; };
const handleLoginSuccess = (userData) => {
  isUserLoggedIn.value = true;
  loggedInUserName.value = userData.user_name || 'Pengguna';
  loggedInUserRole.value = userData.role_name || 'User';
  showLoginModal.value = false;
  displayNotification(`Login berhasil! Selamat datang, ${loggedInUserName.value}.`, 'success');
  // Redirect sudah di LoginForm
};
const handleLoginError = (errorMessage) => {
  displayNotification(errorMessage || 'Login gagal. Silakan coba lagi.', 'error');
};
const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  isUserLoggedIn.value = false;
  loggedInUserName.value = '';
  loggedInUserRole.value = '';
  displayNotification('Anda telah berhasil logout.', 'info');
  router.push('/');
};
onMounted(() => {
  const token = localStorage.getItem('authToken');
  const userDataString = localStorage.getItem('userData');
  if (token && userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      isUserLoggedIn.value = true;
      loggedInUserName.value = userData.user_name ||'Pengguna';
      loggedInUserRole.value = userData.role_name || 'User';
    } catch (e) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }
});

</script>
