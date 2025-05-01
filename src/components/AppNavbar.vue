<template>
  <header class="navbar" :class="{ 'scrolled': isScrolled, 'mobile-open': mobileMenuOpen }">
    <div class="container nav-container">
      <router-link :to="{ name: 'home' }" class="logo" @click="closeMobileMenu">
        <img src="/logo.png" alt="Logo GarmenKeren" class="logo-img" />
        <span class="logo-text">GarmenKeren</span>
      </router-link>

      <!-- Navigasi Utama (Jika belum login) -->
      <nav v-if="!props.isLoggedIn" class="nav-menu" :class="{ 'active': mobileMenuOpen }">
        <ul class="nav-links">
          <li><a href="#hero" @click="handleScrollToSection('#hero')">Home</a></li>
          <li><a href="#featured" @click="handleScrollToSection('#featured')">Produk</a></li>
          <li><a href="#brand" @click="handleScrollToSection('#brand')">Merek</a></li>
          <li><a href="#cta" @click="handleScrollToSection('#cta')">Kontak</a></li>
          <li class="nav-login-mobile">
            <button class="btn btn-secondary login-btn-mobile" @click="triggerLogin">Login</button>
          </li>
        </ul>
      </nav>

      <!-- Navigasi Setelah Login (Dengan Master Dropdown) -->
      <nav v-else class="nav-menu" :class="{ 'active': mobileMenuOpen }">
        <ul class="nav-links">
          <li><router-link :to="{ name: 'dashboard' }" @click="closeMobileMenu">Dashboard</router-link></li>

          <!-- Master Dropdown -->
          <li class="nav-item dropdown" :class="{ 'open': isMasterDropdownOpen }">
            <a href="#" class="nav-link dropdown-toggle" @click.prevent="toggleMasterDropdown">
              Master
              <i class="fas fa-caret-down dropdown-caret"></i>
            </a>
            <ul class="dropdown-menu" :class="{ 'show': isMasterDropdownOpen }">
              <!-- Users (Conditional) -->
              <li v-if="canViewUserManagement">
                <!-- Nama route sudah benar -->
                <router-link :to="{ name: 'user-management' }" @click="closeMobileMenuAndDropdown">Users</router-link>
              </li>
              <!-- Roles -->
              <li>
                <!-- Nama route sudah benar -->
                <router-link :to="{ name: 'role-management' }" @click="closeMobileMenuAndDropdown">Roles</router-link>
              </li>
              <!-- Material Management -->
              <li>
                <!-- PERBAIKAN: Nama route diubah -->
                <router-link :to="{ name: 'material-management' }" @click="closeMobileMenuAndDropdown">Materials</router-link>
              </li>
              <!-- Product Management (Conditional based on canViewProductionOrders - nama computed mungkin perlu diubah?) -->
              <!-- Jika viewnya ProductManagerView, sebaiknya permission/computed juga terkait 'product' -->
              <li v-if="canViewProductManagement"> <!-- PERBAIKAN: Ganti nama computed jika perlu -->
                <!-- PERBAIKAN: Nama route diubah -->
                <router-link :to="{ name: 'product-management' }" @click="closeMobileMenuAndDropdown">
                  Products <!-- PERBAIKAN: Ubah teks link jika perlu -->
                </router-link>
              </li>
            </ul>
          </li>

          <!-- Mobile User Info -->
          <li class="nav-user-mobile">
            <span>Halo, {{ props.userName || 'User' }} ({{ props.roleName || 'Role' }})</span>
            <button @click="handleLogoutClick" class="btn btn-logout-mobile">Logout</button>
          </li>
        </ul>
      </nav>

      <!-- Bagian Aksi Kanan -->
      <div class="nav-actions">
        <button v-if="!props.isLoggedIn" class="btn btn-secondary login-btn-desktop" @click="triggerLogin">
          Login
        </button>
        <div v-else class="user-info-desktop">
          <span class="user-greeting">Halo, {{ props.userName || 'User' }}</span>
          <span class="user-role">({{ props.roleName || 'Role' }})</span>
          <button @click="handleLogoutClick" class="btn btn-logout-desktop" title="Logout">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
        <button class="mobile-menu-toggle" @click="toggleMobileMenu" aria-label="Toggle Menu" :class="{ 'active': mobileMenuOpen }">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const props = defineProps({
  isLoggedIn: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  roleName: { type: String, default: '' }
});

const emit = defineEmits(['login-click', 'logout-click']);

const isScrolled = ref(false);
const mobileMenuOpen = ref(false);
const isMasterDropdownOpen = ref(false);

// Izin akses berdasarkan role (case-insensitive)
const hasRole = (roleName) => {
    if (!props.isLoggedIn || !props.roleName) return false;
    return props.roleName.trim().toLowerCase() === roleName.toLowerCase();
};

const canViewUserManagement = computed(() => hasRole('administrator'));

// PERBAIKAN: Ganti nama computed agar sesuai dengan menu (opsional tapi lebih jelas)
const canViewProductManagement = computed(() => {
    // Sesuaikan role yang boleh akses Product Management di sini
    return hasRole('administrator') || hasRole('operator'); // Contoh
});
// Anda bisa hapus canViewProductionOrders jika tidak dipakai lagi
// const canViewProductionOrders = computed(() => ... );


const handleScroll = () => { isScrolled.value = window.scrollY > 50; };
const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; if (!mobileMenuOpen.value) isMasterDropdownOpen.value = false; };
const closeMobileMenu = () => { mobileMenuOpen.value = false; isMasterDropdownOpen.value = false; };
const toggleMasterDropdown = () => { isMasterDropdownOpen.value = !isMasterDropdownOpen.value; };
const closeMobileMenuAndDropdown = () => { mobileMenuOpen.value = false; isMasterDropdownOpen.value = false; };
const triggerLogin = () => { emit('login-click'); closeMobileMenu(); };
const handleLogoutClick = () => { emit('logout-click'); closeMobileMenu(); };

const handleScrollToSection = (selector) => {
  closeMobileMenu();
  if (route.name !== 'home') {
    router.push({ name: 'home' }).then(() => {
      nextTick(() => { // Tunggu Vue selesai update DOM setelah pindah route
        const element = document.querySelector(selector);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
        else console.warn(`Element dengan selector "${selector}" tidak ditemukan di halaman home.`);
      });
    }).catch(err => { // Tangani potensi error navigasi
        if (err.name !== 'NavigationDuplicated') { // Abaikan jika sudah di halaman home
             console.error('Router push error:', err);
        } else { // Jika sudah di home, langsung scroll
            const element = document.querySelector(selector);
             if (element) element.scrollIntoView({ behavior: 'smooth' });
             else console.warn(`Element dengan selector "${selector}" tidak ditemukan.`);
        }
    });
  } else {
    // Jika sudah di halaman home, langsung scroll
    const element = document.querySelector(selector);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    else console.warn(`Element dengan selector "${selector}" tidak ditemukan.`);
  }
};

onMounted(() => { window.addEventListener('scroll', handleScroll); });
onUnmounted(() => { window.removeEventListener('scroll', handleScroll); });
</script>