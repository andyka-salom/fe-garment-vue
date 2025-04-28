<template>
  <header class="navbar" :class="{ 'scrolled': isScrolled, 'mobile-open': mobileMenuOpen }">
    <div class="container nav-container">
      <!-- Logo -->
      <router-link :to="{ name: 'home' }" class="logo" @click="closeMobileMenu">
        <img src="/logo.png" alt="Logo GarmenKeren" class="logo-img" />
        <span class="logo-text">GarmenKeren</span>
      </router-link>

      <!-- Navigasi Utama (Jika belum login) -->
      <nav v-if="!isLoggedIn" class="nav-menu" :class="{ 'active': mobileMenuOpen }">
        <ul class="nav-links">
          <!-- Link Scroll untuk Home Page -->
          <li><a href="#hero" @click="handleScrollToSection('#hero')">Home</a></li>
          <li><a href="#featured" @click="handleScrollToSection('#featured')">Produk</a></li>
          <li><a href="#brand" @click="handleScrollToSection('#brand')">Merek</a></li>
          <li><a href="#cta" @click="handleScrollToSection('#cta')">Kontak</a></li>
          <!-- Tombol Login Mobile -->
          <li class="nav-login-mobile">
            <button class="btn btn-secondary login-btn-mobile" @click="triggerLogin">Login</button>
          </li>
        </ul>
      </nav>

      <!-- Navigasi Setelah Login -->
      <nav v-else class="nav-menu" :class="{ 'active': mobileMenuOpen }">
        <ul class="nav-links">
          <!-- Menu Aplikasi (Router Links) -->
          <li><router-link :to="{ name: 'dashboard' }" @click="closeMobileMenu">Dashboard</router-link></li>
          <li><router-link :to="{ name: 'user-management' }" @click="closeMobileMenu">Users</router-link></li>
          <li><router-link :to="{ name: 'role-management' }" @click="closeMobileMenu">Roles</router-link></li>
          <li><router-link :to="{ name: 'product-management' }" @click="closeMobileMenu">Products</router-link></li>
          <!-- Info User & Logout (Mobile Only within Menu) -->
          <li class="nav-user-mobile">
            <span>Halo, {{ userName }} ({{ roleName }})</span>
            <button @click="handleLogoutClick" class="btn btn-logout-mobile">Logout</button>
          </li>
        </ul>
      </nav>

      <!-- Bagian Aksi Kanan -->
      <div class="nav-actions">
        <!-- Tombol Login Desktop (Jika belum login) -->
        <button v-if="!isLoggedIn" class="btn btn-secondary login-btn-desktop" @click="triggerLogin">
          Login
        </button>
        <!-- Info User & Logout Desktop (Jika sudah login) -->
        <div v-else class="user-info-desktop">
          <span class="user-greeting">Halo, {{ userName }}</span>
          <span class="user-role">({{ roleName }})</span>
          <button @click="handleLogoutClick" class="btn btn-logout-desktop" title="Logout">
            <i class="fas fa-sign-out-alt"></i> <!-- Pastikan Font Awesome dimuat -->
          </button>
        </div>

        <!-- Tombol Burger Menu -->
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
// Import necessary functions from Vue and Vue Router
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// Get router and route instances
const router = useRouter();
const route = useRoute();

// Define props received from parent component
defineProps({
  isLoggedIn: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  roleName: { type: String, default: '' }
});

// Define events emitted to parent component
const emit = defineEmits(['login-click', 'logout-click']);

// Reactive variables for component state
const isScrolled = ref(false);
const mobileMenuOpen = ref(false);

// --- Event Handlers ---

// Handle window scroll to add/remove 'scrolled' class
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

// Toggle mobile menu visibility
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

// Close mobile menu (used when clicking links or logo)
const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

// Emit login event and close mobile menu
const triggerLogin = () => {
  emit('login-click');
  closeMobileMenu();
};

// Emit logout event and close mobile menu
const handleLogoutClick = () => {
  emit('logout-click');
  closeMobileMenu();
};

// Handle clicks on scroll links (Home, Produk, etc.)
const handleScrollToSection = (selector) => {
  closeMobileMenu();
  // If currently not on the home page, navigate there first
  if (route.name !== 'home') {
    router.push({ name: 'home' }).then(() => {
      // Wait for DOM update after navigation, then scroll
      nextTick(() => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.warn(`Element with selector "${selector}" not found on home page.`);
        }
      });
    });
  } else {
    // If already on the home page, scroll directly
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
       console.warn(`Element with selector "${selector}" not found.`);
    }
  }
};

// --- Lifecycle Hooks ---

// Add scroll listener when component mounts
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

// Remove scroll listener when component unmounts
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>


<style scoped>
/* --- Existing Styles (Copied from your request) --- */

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background-color: var(--white, #fff); /* Added default */
  padding: 15px 0;
  height: var(--navbar-height, 70px); /* Added default */
  transition: background-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease, height 0.3s ease;
  border-bottom: 1px solid transparent;
}
.navbar.scrolled {
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 10px 0;
  height: calc(var(--navbar-height, 70px) - 10px); /* Adjust height */
  border-bottom: 1px solid #eee;
}
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px; /* Example container width */
  margin: 0 auto;
  padding: 0 15px; /* Container padding */
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--primary-color, #007bff); /* Added default */
  flex-shrink: 0;
}
.logo-img {
  height: 40px;
  margin-right: 10px;
  transition: height 0.3s ease;
}
.navbar.scrolled .logo-img {
  height: 35px;
}
.logo-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary-color, #007bff);
}

/* --- Updated/Combined Navigation Menu Styles --- */
.nav-menu {
  display: flex; /* Keep display flex for desktop */
  align-items: center;
  flex-grow: 1;
  justify-content: center; /* Center links on desktop */
}

.nav-links {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 35px; /* Desktop gap */
  padding: 0;
  margin: 0;
}

/* Style both regular links and router-links consistently */
.nav-links li a,
.nav-links li > .router-link { /* Target direct child router-link */
  color: var(--text-color, #333); /* Added default */
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.3s ease;
  padding-bottom: 5px;
  position: relative;
  cursor: pointer;
  text-decoration: none; /* Remove default underline */
  white-space: nowrap;
}

/* Underline effect */
.nav-links li a::after,
.nav-links li > .router-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, var(--primary-color, #007bff), var(--secondary-color, #6c757d)); /* Added defaults */
  transition: width 0.3s ease;
}

/* Hover and Active states */
.nav-links li a:hover,
.nav-links li > .router-link:hover,
.nav-links li .router-link-active { /* Active class for router-link */
  color: var(--primary-color, #007bff);
}

.nav-links li a:hover::after,
.nav-links li > .router-link:hover::after,
.nav-links li .router-link-active::after {
  width: 100%;
}

/* Hide mobile-specific items on desktop */
.nav-login-mobile,
.nav-user-mobile {
    display: none;
}

/* --- Nav Actions (Right Side) --- */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
}
.login-btn-desktop {
  padding: 8px 25px;
  font-weight: 600;
}
/* Style for mobile login button (inside menu) */
.login-btn-mobile {
  display: block; /* Will be shown in mobile menu */
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  text-align: center;
}

/* User Info Desktop */
.user-info-desktop {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}
.user-greeting {
  font-weight: 600;
  white-space: nowrap;
}
.user-role {
  color: var(--light-text-color, #6c757d); /* Added default */
  font-size: 0.85rem;
  margin-right: 5px;
  white-space: nowrap;
}
.btn-logout-desktop {
  padding: 6px 10px;
  font-size: 0.9rem;
  background: transparent;
  color: var(--accent-color, #dc3545); /* Added default */
  border: 1px solid var(--accent-color, #dc3545);
  border-radius: 5px;
  margin-left: 5px;
  line-height: 1;
  transition: background-color 0.3s, color 0.3s;
  cursor: pointer; /* Ensure pointer cursor */
}
.btn-logout-desktop:hover {
  background: rgba(220, 53, 69, 0.1); /* Use accent color for hover */
  color: var(--accent-dark, #bd2130); /* Added default */
}
.btn-logout-desktop i {
  font-size: 1em;
}

/* User Info Mobile (Inside Collapsed Menu) */
/* Styles are applied via media query */
.nav-user-mobile span {
  display: block;
  margin-bottom: 10px;
  font-size: 1rem;
  color: var(--text-color, #333);
  text-align: center; /* Center text in mobile menu */
}
.btn-logout-mobile {
  padding: 10px 15px;
  width: 100%;
  background: var(--accent-color, #dc3545);
  color: var(--white, #fff);
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.btn-logout-mobile:hover {
  background: var(--accent-dark, #bd2130);
}


/* Mobile Menu Toggle (Burger) */
.mobile-menu-toggle {
  display: none; /* Hidden on desktop */
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 101; /* Above nav menu */
}
.mobile-menu-toggle .bar {
  display: block;
  width: 25px;
  height: 3px;
  background-color: var(--primary-color, #007bff);
  border-radius: 2px;
  transition: all 0.3s ease-in-out;
}
/* Burger animation to 'X' */
.mobile-menu-toggle.active .bar:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.mobile-menu-toggle.active .bar:nth-child(2) {
  opacity: 0;
}
.mobile-menu-toggle.active .bar:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* --- Responsive Styles --- */
@media (max-width: 992px) { /* Adjust breakpoint if needed */
  .nav-links {
      gap: 25px; /* Reduce gap on medium screens */
  }
}

@media (max-width: 768px) {
  .nav-menu {
    position: fixed; /* Position fixed for mobile */
    top: var(--navbar-height, 70px); /* Start below navbar */
    left: 0;
    width: 100%;
    height: calc(100vh - var(--navbar-height, 70px)); /* Full remaining height */
    background-color: var(--white, #fff);
    flex-direction: column;
    align-items: center;
    justify-content: flex-start; /* Align items to top */
    padding-top: 30px;
    /* Slide in from right effect */
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
    overflow-y: auto; /* Allow scroll if menu is long */
    /* Make nav-menu visible when mobile-open class is added to header */
    .navbar.mobile-open & { /* Use parent class */
      transform: translateX(0);
    }
  }

  .nav-links {
    flex-direction: column; /* Stack links vertically */
    gap: 0; /* Remove gap, use padding on li/a */
    width: 90%; /* Limit width */
    text-align: center;
    margin-top: 0;
    padding-bottom: 20px;
  }

  .nav-links li {
    width: 100%;
    border-bottom: 1px solid #eee; /* Separator line */
  }
   .nav-links li:last-child {
       border-bottom: none; /* No border for last item */
   }

  /* Adjust link padding for mobile */
  .nav-links li a,
  .nav-links li > .router-link {
    display: block; /* Make links full width */
    padding: 18px 0;
    width: 100%;
    font-size: 1rem;
  }
   /* Hide underline effect on mobile */
   .nav-links li a::after,
   .nav-links li > .router-link::after {
       display: none;
   }

  /* Show mobile-specific items */
  .nav-login-mobile,
  .nav-user-mobile {
      display: block; /* Show these list items */
      border-top: none; /* Remove potential double border */
      margin-top: 0;
      padding-top: 0;
      border-bottom: none;
  }
  /* Add padding/margin for buttons inside mobile menu */
  .nav-login-mobile .login-btn-mobile,
  .nav-user-mobile .btn-logout-mobile {
      margin-top: 15px;
      margin-bottom: 15px;
  }
   .nav-user-mobile span {
       padding-top: 15px; /* Space above user greeting */
   }

  /* Adjust right-side actions */
  .nav-actions {
    gap: 10px;
  }
  .mobile-menu-toggle {
    display: flex; /* Show burger */
  }
  .login-btn-desktop {
    display: none; /* Hide desktop login */
  }
  .user-info-desktop {
    display: none; /* Hide desktop user info */
  }
}
</style>