<template>
  <div class="dashboard-view">
    <div class="container">
      <h1 class="dashboard-title">Selamat Datang di Dashboard!</h1>

      <!-- Loading State -->
      <div v-if="loading" class="loading-indicator">
        <p>Memuat data pengguna...</p>
        <!-- Opsional: Tambahkan spinner di sini -->
        <!-- <div class="spinner"></div> -->
      </div>

      <!-- Success State: User data loaded -->
      <div v-else-if="user" class="user-info-section">
        <p class="welcome-message">
          Halo, <strong>{{ user.user_name || 'Pengguna' }}</strong>!
          Anda login sebagai <strong>{{ user.role_name || 'User' }}</strong>.
        </p>

        <div class="dashboard-widgets">
          <!-- Widget: Ringkasan Akun -->
          <div class="widget-card card"> <!-- Tambahkan class .card jika ingin efek hover global -->
            <h3>Ringkasan Akun</h3>
            <p>Informasi dasar dan preferensi Anda.</p>
            <ul>
              <li>Email: {{ user.email || 'Tidak tersedia' }}</li>
              <li>Tema: {{ user.preferences?.theme || 'Default' }}</li>
              <li>Bahasa: {{ user.preferences?.language || 'id' }}</li>
            </ul>
          </div>

          <!-- Widget: Akses Cepat / Menu -->
          <div class="widget-card card">
            <h3>Akses Cepat</h3>
            <ul v-if="user.menus && Array.isArray(user.menus) && user.menus.length > 0">
              <li v-for="menu in user.menus" :key="menu.id">
                <router-link :to="menu.route || '/'">{{ menu.name || 'Menu Item' }}</router-link>
              </li>
            </ul>
            <p v-else>Tidak ada menu akses cepat yang tersedia untuk peran Anda.</p>
          </div>

          <!-- Widget: Notifikasi (Placeholder) -->
          <div class="widget-card card">
            <h3>Notifikasi</h3>
            <p>Belum ada notifikasi baru untuk Anda.</p>
          </div>
        </div>

      </div>

      <!-- Error State: Failed to load user data -->
      <div v-else class="error-loading">
        <p>Gagal memuat data pengguna. Pastikan Anda sudah login.</p>
        <button @click="goToLogin" class="btn btn-secondary">Coba Login Ulang</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const user = ref(null); // Variable untuk menyimpan data pengguna
const loading = ref(true); // Untuk status loading
const router = useRouter();

onMounted(() => {
  loading.value = true;
  console.log('DashboardView mounted, attempting to load data from localStorage...');

  const storedUserData = localStorage.getItem('userData');
  const storedToken = localStorage.getItem('authToken');

  if (storedUserData && storedToken) {
    console.log("Found userData and authToken in localStorage.");
    try {
      const parsedData = JSON.parse(storedUserData);
      console.log("Parsed userData:", parsedData);

      // Validasi sederhana: Pastikan data yang diparsing adalah objek dan memiliki beberapa properti kunci
      if (typeof parsedData === 'object' && parsedData !== null && parsedData.user_name && parsedData.role_name) {
        user.value = parsedData; // Menyimpan data pengguna yang valid
        console.log('User data successfully loaded into component state.');
      } else {
        console.error('Parsed user data is invalid or missing required fields.');
        clearInvalidDataAndRedirect();
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      clearInvalidDataAndRedirect(); // Hapus data yang tidak valid
    }
  } else {
    console.warn("User data or auth token not found in localStorage.");
    clearInvalidDataAndRedirect(); // Jika data tidak ditemukan, alihkan ke login
  }

  loading.value = false; // Selesai loading
  console.log('Loading finished. User state:', user.value);
});

// Fungsi untuk menghapus data yang tidak valid dan mengarahkan pengguna ke login
const clearInvalidDataAndRedirect = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  user.value = null; // Set user ke null jika ada data yang salah
  router.push('/'); // Redirect ke halaman login
}

// Fungsi untuk tombol "Login Ulang"
const goToLogin = () => {
  router.push('/'); // Mengarahkan ke halaman login
}

</script>

<style scoped>
/* Anda bisa menambahkan beberapa styling di sini */
.dashboard-title {
  font-size: 2em;
  text-align: center;
}

.widget-card {
  margin: 10px;
  padding: 15px;
  border-radius: 10px;
  background-color: #f4f4f4;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card {
  transition: transform 0.2s ease-in-out;
}

.card:hover {
  transform: scale(1.05);
}

.loading-indicator, .error-loading {
  text-align: center;
}

.loading-indicator {
  color: #555;
}

.error-loading p {
  color: red;
  font-weight: bold;
}
</style>
