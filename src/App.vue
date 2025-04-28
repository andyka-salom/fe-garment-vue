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

<style>
/* --- Global Styles (Keep as is) --- */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

:root {
  --primary-color: #6a11cb;
  --secondary-color: #2575fc;
  --accent-color: #ff6b6b;
  --text-color: #333333;
  --light-text-color: #777;
  --background-color: #ffffff;
  --light-gray: #f4f7f6;
  --white: #ffffff;
  --navbar-height: 70px;
  --error-color: #e74c3c;
  --success-color: #2ecc71; /* Add success color */
  --info-color: #3498db;   /* Add info color */
  --warning-color: #f39c12; /* Add warning color */
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; scroll-padding-top: var(--navbar-height); }
body { font-family: 'Poppins', sans-serif; line-height: 1.6; color: var(--text-color); background-color: var(--background-color); overflow-x: hidden; }
.main-content {
  flex-grow: 1; /* 4. Biarkan <main> mengisi ruang kosong di antara navbar dan footer */
  padding-top: var(--navbar-height); /* 5. Beri jarak dari Navbar (jika fixed/sticky) */
  width: 100%; /* Pastikan lebar penuh */
}
section { padding: 80px 20px; overflow: hidden; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-bottom: 1rem; line-height: 1.3; }
h2.section-title { text-align: center; font-size: 2.2rem; margin-bottom: 50px; position: relative; padding-bottom: 15px; }
h2.section-title::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 4px; background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)); border-radius: 2px; }
p { margin-bottom: 1rem; color: var(--light-text-color); }
a { text-decoration: none; color: var(--primary-color); transition: color 0.3s ease; }
a:hover { color: var(--secondary-color); }
img { max-width: 100%; height: auto; display: block; }
ul { list-style: none; }
.text-center { text-align: center; }
.btn { display: inline-block; padding: 12px 30px; border: none; border-radius: 30px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; text-align: center; font-size: 0.95rem; letter-spacing: 0.5px; }
.btn-primary { background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)); color: var(--white); box-shadow: 0 5px 15px rgba(37, 117, 252, 0.3); }
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(37, 117, 252, 0.4); }
.btn-secondary { background: transparent; color: var(--primary-color); border: 2px solid var(--primary-color); }
.btn-secondary:hover { background: var(--primary-color); color: var(--white); }
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; animation: backdropFadeIn 0.3s ease; }
@keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 768px) { h2.section-title { font-size: 1.8rem; } section { padding: 60px 15px; } .container { padding: 0 15px; } }
.navbar { height: var(--navbar-height); }


/* --- Notification Styles --- */
.notification {
  position: fixed;
  top: calc(var(--navbar-height) + 15px); /* Position below navbar */
  left: 50%;
  transform: translateX(-50%);
  min-width: 300px;
  max-width: 90%;
  background-color: var(--white);
  color: var(--text-color);
  padding: 15px 40px 15px 20px; /* Extra padding on right for close button */
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  z-index: 1050; /* Above modal backdrop, below potential active modal */
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left-width: 5px;
  border-left-style: solid;
  animation: slideDownFadeIn 0.4s ease-out;
}

@keyframes slideDownFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%);
  }
}

.notification p {
  margin: 0;
  color: inherit; /* Inherit color from parent */
  line-height: 1.4;
}

.notification--success {
  background-color: #e8f5e9; /* Lighter green */
  border-left-color: var(--success-color);
  color: #1b5e20; /* Darker green text */
}

.notification--error {
  background-color: #ffebee; /* Lighter red */
  border-left-color: var(--error-color);
  color: #c62828; /* Darker red text */
}

.notification--info {
  background-color: #e3f2fd; /* Lighter blue */
  border-left-color: var(--info-color);
  color: #0d47a1; /* Darker blue text */
}

.notification--warning {
    background-color: #fff8e1; /* Lighter yellow */
    border-left-color: var(--warning-color);
    color: #e65100; /* Darker orange text */
}


.close-notification-btn {
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  color: inherit; /* Inherit color */
  opacity: 0.7;
  padding: 5px;
}

.close-notification-btn:hover {
  opacity: 1;
}

</style>