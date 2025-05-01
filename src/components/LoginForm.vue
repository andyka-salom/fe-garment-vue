<template>
  <div class="login-card" @click.stop>
    <button @click="$emit('close-modal')" class="close-btn" aria-label="Tutup Login">×</button>
    <h2 class="login-title">Login ke Akun Anda</h2>
    <p class="login-subtitle">Masukkan email dan password untuk melanjutkan.</p>

    <!-- Display error directly from the store's computed property -->
    <div v-if="loginError" class="alert alert-danger" role="alert">
        {{ loginError }}
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="input-group" :class="{ 'has-content': email }">
        <!-- Comment moved outside the input tag -->
        <!-- Clear store error on input -->
        <input
          type="email"
          id="email"
          v-model.trim="email"
          @input="clearLoginError"
          required
          autocomplete="email"
          :disabled="isLoading" />
        <label for="email">Email</label>
        <span class="input-focus-line"></span>
      </div>

      <div class="input-group" :class="{ 'has-content': password }">
         <!-- Comment moved outside the input tag -->
         <!-- Clear store error on input -->
        <input
          :type="showPassword ? 'text' : 'password'"
          id="password"
          v-model="password"
          @input="clearLoginError"
          required
          autocomplete="current-password"
          :disabled="isLoading" />
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
        <!-- Display loading state from store -->
        <span v-if="!isLoading">Login Sekarang</span>
        <span v-else class="spinner"></span>
      </button>

      <p class="signup-link">
        Belum punya akun? <a href="#">Daftar di sini!</a>
      </p>
    </form>
  </div>
</template>

<script setup>
// Keep the <script setup> block as it was in the previous correct answer
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // Adjust path if needed

const emit = defineEmits(['close-modal', 'login-success', 'login-error']); // Keep emits for UI coordination

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const router = useRouter();
const authStore = useAuthStore(); // Get the store instance

// Computed properties directly linked to the store's state
const isLoading = computed(() => authStore.loading);
const loginError = computed(() => authStore.error); // Display error from store

const handleLogin = async () => {
    // Call the Pinia action
    const success = await authStore.handleLogin({
        email: email.value,
        password: password.value,
    });

    if (success) {
        console.log('Login Successful via Pinia Action!');
        emit('login-success'); // Signal success to parent (e.g., for notification)
        emit('close-modal');   // Signal to close the modal
        // Redirect AFTER successful login confirmed by the store action
        // Use replace to avoid adding login page to history after successful login
        router.replace('/dashboard');
        console.log('Redirecting to dashboard...');
    } else {
        // Error is already set in the store and displayed via computed property
        console.error('Login Failed via Pinia Action. Error:', authStore.error);
        emit('login-error', authStore.error); // Optionally signal error details to parent
    }
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

// Call the store's action to clear the error
const clearLoginError = () => {
    if (authStore.error) {
        authStore.clearError();
    }
};
</script>

