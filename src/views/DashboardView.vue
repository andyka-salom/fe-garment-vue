<template>
    <div class="dashboard-view">
      <div class="container">
        <h1 class="dashboard-title">Selamat Datang di Dashboard!</h1>
  
        <div v-if="loading" class="loading-indicator">
          <p>Memuat data...</p>
          <!-- Anda bisa menambahkan spinner di sini jika mau -->
        </div>
  
        <div v-else-if="user" class="user-info-section">
          <p class="welcome-message">
            Halo, <strong>{{ user.user_name }}</strong>! Anda login sebagai <strong>{{ user.role_name }}</strong>.
          </p>
  
          <div class="dashboard-widgets">
            <!-- Contoh Widget Placeholder 1 -->
            <div class="widget-card">
              <h3>Ringkasan Akun</h3>
              <p>Ini adalah tempat untuk ringkasan cepat akun Anda.</p>
              <ul>
                <li>Tema: {{ user.preferences?.theme || 'Default' }}</li>
                <li>Bahasa: {{ user.preferences?.language || 'Default' }}</li>
              </ul>
            </div>
  
            <!-- Contoh Widget Placeholder 2 -->
            <div class="widget-card">
              <h3>Akses Cepat</h3>
              <p>Tautan cepat ke fitur penting:</p>
              <!-- Tampilkan menu sebagai tautan jika ada -->
              <ul v-if="user.menus && user.menus.length > 0">
                 <li v-for="menu in user.menus" :key="menu.id">
                    <router-link :to="menu.route">{{ menu.name }}</router-link>
                 </li>
              </ul>
              <p v-else>Tidak ada menu yang tersedia.</p>
            </div>
  
             <!-- Contoh Widget Placeholder 3 -->
             <div class="widget-card">
              <h3>Notifikasi</h3>
              <p>Belum ada notifikasi baru.</p>
              <!-- Tempat untuk menampilkan notifikasi -->
            </div>
          </div>
  
          <!-- (Opsional) Tampilkan Token untuk Debugging -->
          <!--
          <div class="token-info">
            <p>Token Anda (hanya untuk debugging):</p>
            <pre class="token-display">{{ authToken }}</pre>
          </div>
          -->
  
        </div>
  
        <div v-else class="error-loading">
          <p>Gagal memuat data pengguna. Silakan coba login kembali.</p>
          <button @click="goToLogin" class="btn btn-secondary">Login Ulang</button>
        </div>
  
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router'; // Impor useRouter untuk redirect
  
  const user = ref(null);
  const authToken = ref(null);
  const loading = ref(true); // State untuk indikator loading
  const router = useRouter(); // Instance router
  
  onMounted(() => {
    loading.value = true; // Mulai loading
    console.log('DashboardView mounted, trying to load user data...');
    const storedUserData = localStorage.getItem('userData');
    const storedToken = localStorage.getItem('authToken');
  
    if (storedUserData && storedToken) {
      try {
        const parsedData = JSON.parse(storedUserData);
        // Validasi sederhana tambahan
        if (parsedData && parsedData.token === storedToken) {
            user.value = parsedData;
            authToken.value = storedToken; // Simpan token jika perlu ditampilkan
            console.log('User data loaded successfully:', user.value);
        } else {
            console.error("Token mismatch or invalid user data structure.");
            // Hapus data tidak valid
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
      } catch (e) {
        console.error("Gagal memuat atau parse data user dari localStorage:", e);
        // Hapus data korup
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    } else {
      console.warn("No user data or token found in localStorage for dashboard.");
      // Jika tidak ada data sama sekali, navigation guard seharusnya sudah handle,
      // tapi bisa tambahkan fallback redirect di sini jika perlu
      // router.push('/');
    }
    loading.value = false; // Selesai loading (baik sukses maupun gagal)
  });
  
  // Fungsi untuk redirect ke halaman utama jika gagal load data
  const goToLogin = () => {
      router.push('/'); // Arahkan ke halaman utama (yang akan menampilkan modal login jika belum login)
  }
  
  </script>
  
  <style scoped>
  .dashboard-view {
    padding: 40px 0; /* Padding atas bawah */
    background-color: #f4f7f6; /* Background berbeda untuk dashboard */
    min-height: calc(100vh - var(--navbar-height)); /* Pastikan mengisi tinggi layar */
  }
  
  .dashboard-title {
    color: var(--primary-color);
    margin-bottom: 30px;
    text-align: center;
    font-size: 2.5rem;
  }
  
  .loading-indicator, .error-loading {
      text-align: center;
      padding: 50px 20px;
      color: var(--light-text-color);
  }
  .error-loading p {
      margin-bottom: 20px;
      font-size: 1.1rem;
  }
  
  .welcome-message {
    font-size: 1.2rem;
    margin-bottom: 30px;
    text-align: center;
    color: var(--text-color);
  }
  .welcome-message strong {
      color: var(--primary-color);
      font-weight: 600;
  }
  
  .dashboard-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Grid responsif */
    gap: 30px;
  }
  
  .widget-card {
    background-color: var(--white);
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .widget-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .widget-card h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.3rem;
    color: var(--primary-color);
    border-bottom: 2px solid var(--light-gray);
    padding-bottom: 10px;
  }
  
  .widget-card p {
    margin-bottom: 15px;
    color: var(--light-text-color);
    font-size: 0.95rem;
  }
  
  .widget-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 0.9rem;
  }
  
  .widget-card li {
      margin-bottom: 8px;
      padding-left: 15px;
      position: relative;
  }
  .widget-card li::before { /* Custom bullet */
      content: '•';
      position: absolute;
      left: 0;
      color: var(--secondary-color);
      font-weight: bold;
  }
  
  .widget-card ul a {
      color: var(--secondary-color);
      text-decoration: none;
      font-weight: 500;
  }
  .widget-card ul a:hover {
      text-decoration: underline;
      color: var(--primary-color);
  }
  
  
  .token-info {
      margin-top: 40px;
      background: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
  }
  .token-info p {
      margin-bottom: 10px;
      font-weight: 500;
  }
  
  pre.token-display {
    background-color: #ddd;
    padding: 10px;
    border-radius: 3px;
    word-wrap: break-word;
    white-space: pre-wrap;
    font-size: 0.75rem;
    max-height: 100px;
    overflow-y: auto;
    color: #555;
  }
  </style>