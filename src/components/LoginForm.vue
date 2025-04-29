<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
const emit = defineEmits(['close-modal', 'login-error', 'login-success']);

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  isLoading.value = true;
  try {
    const response = await axios.post(
      `${process.env.VUE_APP_API_URL}/login`,
      {
        email: email.value,
        password: password.value,
      },
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    if (response.data && response.data.message === "Login successful" && response.data.data && response.data.data.token) {
      console.log('Login Berhasil! Response data:', response.data.data);

      const token = response.data.data.token; 
      const fullUserData = response.data.data; 

      localStorage.setItem('authToken', token);
      console.log('authToken saved:', localStorage.getItem('authToken'));

      localStorage.setItem('userData', JSON.stringify(fullUserData));
      console.log('userData saved:', localStorage.getItem('userData'));

      emit('login-success', fullUserData);

      emit('close-modal');

      setTimeout(() => {
        router.push('/dashboard');
        console.log('Redirecting to dashboard...');
      }, 300);

    } else {
      const errorMessage = response.data?.message || 'Login berhasil, tetapi data tidak lengkap dari server.';
      console.error('Login response format unexpected:', response.data);
      emit('login-error', errorMessage);
    }
  } catch (err) {
    console.error("Login API error:", err);
    let errorMessage = 'Terjadi kesalahan saat login.';
    if (err.response && err.response.data && err.response.data.message) {
      errorMessage = err.response.data.message;
    } else if (err.response && err.response.status === 401) {
      errorMessage = 'Email atau password salah.';
    } else if (err.request) {
      errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
    } else {
       errorMessage = err.message || 'Terjadi kesalahan tidak terduga.';
    }
    emit('login-error', errorMessage);
  } finally {
    isLoading.value = false;
  }
};

const togglePasswordVisibility = () => { showPassword.value = !showPassword.value; };
</script>


<template>
  <div class="login-card" @click.stop>
    <button @click="$emit('close-modal')" class="close-btn" aria-label="Tutup Login">×</button>
    <h2 class="login-title">Login ke Akun Anda</h2>
    <p class="login-subtitle">Masukkan email dan password untuk melanjutkan.</p>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="input-group" :class="{ 'has-content': email }">
        <input type="email" id="email" v-model.trim="email" required autocomplete="email" :disabled="isLoading" />
        <label for="email">Email</label>
        <span class="input-focus-line"></span>
      </div>

      <div class="input-group" :class="{ 'has-content': password }">
        <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" required autocomplete="current-password" :disabled="isLoading" />
        <label for="password">Password</label>
        <button type="button" @click="togglePasswordVisibility" class="password-toggle" aria-label="Toggle password visibility" :disabled="isLoading">
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </button>
        <span class="input-focus-line"></span>
      </div>

      <div class="form-options">
        <a href="#" class="forgot-password">Lupa Password?</a>
      </div>

      <button type="submit" class="btn-login" :disabled="isLoading">
        <span v-if="!isLoading">Login Sekarang</span>
        <span v-else class="spinner"></span>
      </button>

      <p class="signup-link">
        Belum punya akun? <a href="#">Daftar di sini!</a>
      </p>
    </form>
  </div>
</template>