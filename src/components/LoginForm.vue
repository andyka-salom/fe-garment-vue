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
    const response = await axios.post('http://back-end.test/api/login', {
      email: email.value,
      password: password.value,
    }, { headers: { 'Accept': 'application/json' } });

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

<style scoped>
  .login-card {
    background-color: var(--white);
    padding: 35px 30px;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 420px;
    text-align: center;
    animation: zoomIn 0.4s ease-out;
    position: relative;
  }

  @keyframes zoomIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--light-text-color);
    cursor: pointer;
    line-height: 1;
    padding: 5px;
    transition: color 0.3s ease;
  }

  .close-btn:hover {
    color: var(--text-color);
  }

  .login-title {
    color: var(--text-color);
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .login-subtitle {
    color: var(--light-text-color);
    font-size: 0.95rem;
    margin-bottom: 30px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .input-group {
    position: relative;
  }

  .input-group input {
    width: 100%;
    padding: 18px 15px 8px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    background-color: var(--background-color);
  }

  .input-group input:disabled {
    background-color: #eee;
    cursor: not-allowed;
  }

  .input-group label {
    position: absolute;
    top: 14px;
    left: 15px;
    color: var(--light-text-color);
    pointer-events: none;
    transition: all 0.3s ease;
    font-size: 1rem;
    background-color: var(--white);
    padding: 0 5px;
  }

  .input-group input:focus + label,
  .input-group.has-content input + label {
    top: -10px;
    font-size: 0.75rem;
    color: var(--primary-color);
  }

  .input-focus-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--primary-color);
    transform: scaleX(0);
    transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    border-radius: 0 0 8px 8px;
    z-index: 1;
  }

  .input-group input:focus ~ .input-focus-line {
    transform: scaleX(1);
  }

  .input-group input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .password-toggle {
    position: absolute;
    top: 50%;
    right: 15px;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--light-text-color);
    padding: 5px;
    z-index: 2;
  }

    .password-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    }

  .password-toggle i {
    font-size: 1.1rem;
  }

  .password-toggle:hover:not(:disabled) {
    color: var(--primary-color);
  }

  .form-options {
    display: flex;
    justify-content: flex-end;
    margin-top: -10px;
    margin-bottom: 10px;
  }

  .forgot-password {
    color: var(--secondary-color);
    text-decoration: none;
    font-size: 0.85rem;
    transition: color 0.3s ease;
  }

  .forgot-password:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }

  .btn-login {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    padding: 15px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(37, 117, 252, 0.3);
    position: relative;
    overflow: hidden;
    min-height: 50px;
  }

    .btn-login:disabled {
        background: #ccc;
        box-shadow: none;
        cursor: not-allowed;
        opacity: 0.6;
    }

  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--white);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    vertical-align: middle;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .signup-link {
    font-size: 0.85rem;
    margin-top: 20px;
    color: var(--light-text-color);
  }

  .signup-link a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .signup-link a:hover {
    color: var(--secondary-color);
  }

  .login-error-message {
      color: var(--error-color);
      font-size: 0.85rem;
      margin-top: -10px;
      margin-bottom: 15px;
      text-align: left;
  }
</style>