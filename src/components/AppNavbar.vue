// src/components/Navbar.vue (or wherever your Navbar is)

<script setup>
// ... (keep existing script setup content) ...
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
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

const canViewUserManagement = computed(() => {
  if (!props.isLoggedIn) return false;
  const roleFromProp = props.roleName;
  if (roleFromProp) {
    return roleFromProp.trim().toLowerCase() === 'administrator';
  }
  return false;
});

// --- Add computed property for Production Orders (Example: Allow more roles) ---
// Decide which roles can see this. Here, Admin or 'Operator' (adjust as needed)
const canViewProductionOrders = computed(() => {
  if (!props.isLoggedIn) return false;
  const roleFromProp = props.roleName;
  if (roleFromProp) {
    const lowerRole = roleFromProp.trim().toLowerCase();
    return lowerRole === 'administrator' || lowerRole === 'operator'; // Example roles
  }
  return false;
});
// --- END COMPUTED PROPERTY ---


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
      nextTick(() => {
        const element = document.querySelector(selector);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
        else console.warn(`Element with selector "${selector}" not found on home page.`);
      });
    });
  } else {
    const element = document.querySelector(selector);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    else console.warn(`Element with selector "${selector}" not found.`);
  }
};

onMounted(() => { window.addEventListener('scroll', handleScroll); });
onUnmounted(() => { window.removeEventListener('scroll', handleScroll); });

</script>

<template>
  <header class="navbar" :class="{ 'scrolled': isScrolled, 'mobile-open': mobileMenuOpen }">
    <div class="container nav-container">
      <router-link :to="{ name: 'home' }" class="logo" @click="closeMobileMenu">
        <img src="/logo.png" alt="Logo GarmenKeren" class="logo-img" />
        <span class="logo-text">GarmenKeren</span>
      </router-link>

      <!-- Navigasi Utama (Jika belum login) -->
      <nav v-if="!props.isLoggedIn" class="nav-menu" :class="{ 'active': mobileMenuOpen }">
         <!-- ... (unchanged) ... -->
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
                <router-link :to="{ name: 'user-management' }" @click="closeMobileMenuAndDropdown">Users</router-link>
              </li>
              <!-- Roles -->
              <li><router-link :to="{ name: 'role-management' }" @click="closeMobileMenuAndDropdown">Roles</router-link></li>
              <!-- Products -->
              <li><router-link :to="{ name: 'product-management' }" @click="closeMobileMenuAndDropdown">Products</router-link></li>
               <!-- Categories -->
              <li><router-link :to="{ name: 'category-management' }" @click="closeMobileMenuAndDropdown">Categories</router-link></li>

          <!-- Production Orders (Conditional based on canViewProductionOrders) -->
          <li v-if="canViewProductionOrders">
            <router-link :to="{ name: 'production-order-management' }" @click="closeMobileMenuAndDropdown">
              Production Orders
            </router-link>
          </li>
          <!-- End Production Orders -->

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
         <!-- ... (unchanged login/logout buttons and burger) ... -->
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

