<template>
  <header class="navbar" :class="{ 'scrolled': isScrolled, 'mobile-open': mobileMenuOpen }">
    <div class="container nav-container">
      <!-- Logo -->
      <router-link :to="{ name: 'home' }" class="logo" @click="closeMobileMenu">
        <!-- Ganti '/logo.png' dengan path logo Anda -->
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

      <!-- Navigasi Setelah Login (Dengan Master Dropdown) -->
      <nav v-else class="nav-menu" :class="{ 'active': mobileMenuOpen }">
        <ul class="nav-links">
          <!-- Menu Aplikasi (Router Links) -->
          <li><router-link :to="{ name: 'dashboard' }" @click="closeMobileMenu">Dashboard</router-link></li>

          <!-- Master Dropdown -->
          <li class="nav-item dropdown" :class="{ 'open': isMasterDropdownOpen }">
            <a href="#" class="nav-link dropdown-toggle" @click.prevent="toggleMasterDropdown">
              Master
              <!-- Pastikan Font Awesome tersedia atau ganti ikon -->
              <i class="fas fa-caret-down dropdown-caret"></i>
            </a>
            <ul class="dropdown-menu" :class="{ 'show': isMasterDropdownOpen }">
              <li><router-link :to="{ name: 'user-management' }" @click="closeMobileMenuAndDropdown">Users</router-link></li>
              <li><router-link :to="{ name: 'role-management' }" @click="closeMobileMenuAndDropdown">Roles</router-link></li>
              <li><router-link :to="{ name: 'product-management' }" @click="closeMobileMenuAndDropdown">Products</router-link></li>
              <li><router-link :to="{ name: 'category-management' }" @click="closeMobileMenuAndDropdown">Categories</router-link></li> <!-- Link Kategori Ditambahkan -->
            </ul>
          </li>
          <!-- End Master Dropdown -->

          <!-- Info User & Logout (Mobile Only within Menu) -->
          <li class="nav-user-mobile">
            <span>Halo, {{ userName || 'User' }} ({{ roleName || 'Role' }})</span>
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
          <span class="user-greeting">Halo, {{ userName || 'User' }}</span>
          <span class="user-role">({{ roleName || 'Role' }})</span>
          <button @click="handleLogoutClick" class="btn btn-logout-desktop" title="Logout">
             <!-- Pastikan Font Awesome tersedia atau ganti ikon -->
            <i class="fas fa-sign-out-alt"></i>
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
const isMasterDropdownOpen = ref(false); // State for Master dropdown

// --- Event Handlers ---

// Handle window scroll to add/remove 'scrolled' class
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

// Toggle mobile menu visibility
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  // Close dropdown when closing mobile menu
  if (!mobileMenuOpen.value) {
    isMasterDropdownOpen.value = false;
  }
};

// Close mobile menu (used when clicking non-dropdown links or logo)
const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  isMasterDropdownOpen.value = false; // Also close dropdown
};

// Toggle Master dropdown visibility
const toggleMasterDropdown = () => {
  isMasterDropdownOpen.value = !isMasterDropdownOpen.value;
};

// Close mobile menu AND Master dropdown (used for dropdown links)
const closeMobileMenuAndDropdown = () => {
  mobileMenuOpen.value = false;
  isMasterDropdownOpen.value = false;
};

// Emit login event and close mobile menu
const triggerLogin = () => {
  emit('login-click');
  closeMobileMenu(); // Will also close dropdown if open
};

// Emit logout event and close mobile menu
const handleLogoutClick = () => {
  emit('logout-click');
  closeMobileMenu(); // Will also close dropdown if open
};

// Handle clicks on scroll links (Home, Produk, etc.)
const handleScrollToSection = (selector) => {
  closeMobileMenu(); // Will also close dropdown if open
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
  // Optional: Add click outside listener for desktop dropdown closing
  // document.addEventListener('click', handleClickOutside);
});

// Remove scroll listener when component unmounts
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  // Optional: Remove click outside listener
  // document.removeEventListener('click', handleClickOutside);
});

/*
// Optional: Click outside handler (needs refinement based on exact DOM structure/refs)
const handleClickOutside = (event) => {
  // You might need to use refs on the dropdown toggle and menu
  // for a more robust implementation
  const dropdownElement = event.target.closest('.nav-item.dropdown');
  if (isMasterDropdownOpen.value && !dropdownElement) {
     isMasterDropdownOpen.value = false;
  }
};
*/
</script>

<style scoped>
/* --- Base Variables (Optional but recommended) --- */
:root {
  --primary-color: #0d6efd; /* Bootstrap Primary Blue */
  --secondary-color: #6c757d; /* Bootstrap Secondary Gray */
  --accent-color: #dc3545; /* Bootstrap Danger Red */
  --accent-dark: #bd2130;
  --white: #fff;
  --text-color: #212529; /* Bootstrap Default Text */
  --light-text-color: #6c757d;
  --navbar-height: 70px;
  --border-color: #dee2e6; /* Bootstrap Border Color */
  --link-hover-color: #0a58ca; /* Darker blue for hover */
  --dropdown-bg: var(--white);
  --dropdown-hover-bg: #e9ecef; /* Bootstrap Light Gray */
}

/* --- Navbar Base --- */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1030; /* Bootstrap default z-index for fixed navbar */
  background-color: var(--white);
  padding: 15px 0;
  height: var(--navbar-height);
  transition: background-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease, height 0.3s ease;
  border-bottom: 1px solid transparent;
}
.navbar.scrolled {
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); /* Bootstrap small shadow */
  padding: 10px 0;
  height: calc(var(--navbar-height) - 10px);
  border-bottom: 1px solid var(--border-color);
}
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

/* --- Logo --- */
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--primary-color);
  flex-shrink: 0; /* Prevent logo from shrinking */
}
.logo-img {
  height: 40px; /* Adjust as needed */
  margin-right: 10px;
  transition: height 0.3s ease;
}
.navbar.scrolled .logo-img {
  height: 35px; /* Slightly smaller when scrolled */
}
.logo-text {
  font-size: 1.5rem; /* Adjust size */
  font-weight: 700; /* Bold */
  color: var(--primary-color);
  white-space: nowrap; /* Prevent wrapping */
}

/* --- Navigation Menu Base --- */
.nav-menu {
  display: flex;
  align-items: center;
  flex-grow: 1; /* Allow menu to take up space */
  justify-content: center; /* Center links horizontally */
}
.nav-links {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 35px; /* Spacing between desktop links */
  padding: 0;
  margin: 0;
}

/* Style regular links, router-links, and dropdown toggles consistently */
.nav-links li a,
.nav-links li > .router-link, /* Target direct child router-link */
.nav-links li > .dropdown-toggle { /* Target direct child dropdown toggle */
  color: var(--text-color);
  font-weight: 500; /* Medium weight */
  font-size: 1rem; /* Standard font size */
  transition: color 0.3s ease;
  padding-bottom: 5px; /* Space for potential underline */
  position: relative;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap; /* Prevent wrapping */
}

/* Underline effect for non-dropdown items */
.nav-links li:not(.dropdown) a::after,
.nav-links li:not(.dropdown) > .router-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, var(--primary-color), var(--link-hover-color));
  transition: width 0.3s ease;
}

/* Hover and Active states for non-dropdown items */
.nav-links li:not(.dropdown) a:hover,
.nav-links li:not(.dropdown) > .router-link:hover,
.nav-links li:not(.dropdown) .router-link-active { /* Active class for router-link */
  color: var(--link-hover-color);
}
.nav-links li:not(.dropdown) a:hover::after,
.nav-links li:not(.dropdown) > .router-link:hover::after,
.nav-links li:not(.dropdown) .router-link-active::after {
  width: 100%;
}

/* Style dropdown toggle hover/active separately */
.nav-links li.dropdown > .dropdown-toggle:hover,
.nav-links li.dropdown.open > .dropdown-toggle {
  color: var(--link-hover-color);
}

/* Hide mobile-specific items on desktop */
.nav-login-mobile,
.nav-user-mobile {
    display: none;
}

/* --- Dropdown Specific Styles --- */
.nav-item.dropdown {
  position: relative; /* Needed for absolute positioning of dropdown menu */
}
.dropdown-toggle .dropdown-caret {
  margin-left: 6px;
  font-size: 0.8em;
  transition: transform 0.3s ease;
  display: inline-block; /* Ensure transform works */
}
/* Rotate caret when dropdown is open */
.nav-item.dropdown.open .dropdown-caret {
    transform: rotate(180deg);
}
.dropdown-menu {
  display: none; /* Hidden by default */
  position: absolute;
  top: calc(100% + 5px); /* Position below the parent li with a small gap */
  left: 0;
  min-width: 200px; /* Adjust as needed */
  background-color: var(--dropdown-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); /* Bootstrap dropdown shadow */
  border-radius: 0.375rem; /* Bootstrap border radius */
  list-style: none;
  padding: 0.5rem 0; /* Bootstrap padding */
  margin: 0;
  z-index: 1000; /* Bootstrap default */
  opacity: 0; /* Start hidden for transition */
  visibility: hidden;
  transform: translateY(10px);
  transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out, transform 0.15s ease-in-out;
}
/* Show dropdown menu */
.dropdown-menu.show {
  display: block;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.dropdown-menu li {
  width: 100%;
}
/* Style links inside dropdown */
.dropdown-menu li a,
.dropdown-menu li > .router-link {
  display: block;
  padding: 0.5rem 1rem; /* Bootstrap item padding */
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--text-color);
  text-decoration: none;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  transition: background-color 0.2s ease, color 0.2s ease;
  /* Reset styles from main nav links */
  padding-bottom: 0.5rem; /* Consistent padding */
  border-bottom: none;
}
.dropdown-menu li a::after, /* Remove underline effect */
.dropdown-menu li > .router-link::after {
    display: none;
}
.dropdown-menu li a:hover,
.dropdown-menu li > .router-link:hover,
.dropdown-menu li .router-link-active { /* Highlight active route in dropdown */
  background-color: var(--dropdown-hover-bg);
  color: var(--text-color); /* Keep text color standard on hover, or change if needed */
}

/* --- Nav Actions (Right Side) --- */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0; /* Prevent actions from shrinking */
}
/* Buttons Base */
.btn {
  padding: 0.375rem 0.75rem; /* Bootstrap default btn padding */
  border-radius: 0.375rem; /* Bootstrap default */
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  border: 1px solid transparent;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  font-size: 1rem;
  line-height: 1.5;
  user-select: none;
}
.btn-secondary {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: var(--white);
}
.btn-secondary:hover {
  background-color: #5a6268; /* Darker gray */
  border-color: #545b62;
}
.login-btn-desktop {
  padding: 0.375rem 1rem; /* Slightly more padding */
}
/* User Info Desktop */
.user-info-desktop {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}
.user-greeting {
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-color);
}
.user-role {
  color: var(--light-text-color);
  font-size: 0.85rem;
  margin-right: 5px;
  white-space: nowrap;
}
.btn-logout-desktop {
  padding: 5px 8px;
  font-size: 0.9rem;
  background: transparent;
  color: var(--accent-color);
  border: 1px solid transparent; /* No border initially */
  border-radius: 50%; /* Make it circular */
  margin-left: 5px;
  line-height: 1;
  cursor: pointer;
  width: 32px; /* Fixed width */
  height: 32px; /* Fixed height */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-logout-desktop:hover {
  background: rgba(220, 53, 69, 0.1); /* Light red background */
  color: var(--accent-dark);
  border-color: transparent;
}
.btn-logout-desktop i {
  font-size: 1.1em; /* Adjust icon size */
  vertical-align: middle;
}

/* --- Mobile Menu Toggle (Burger) --- */
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
  z-index: 1031; /* Above navbar content, below modal backdrop if any */
  margin-left: 10px; /* Space from other actions */
}
.mobile-menu-toggle .bar {
  display: block;
  width: 25px;
  height: 3px;
  background-color: var(--primary-color);
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
@media (max-width: 992px) {
  .nav-links {
      gap: 25px; /* Reduce gap on medium screens */
  }
  .logo-text {
      font-size: 1.4rem;
  }
}

@media (max-width: 768px) {
  /* --- Mobile Menu General --- */
  .nav-menu {
    position: fixed;
    /* Dynamically calculate top based on current navbar height */
    top: var(--navbar-height); /* Default */
    .navbar.scrolled & { /* Use parent class to adjust */
        top: calc(var(--navbar-height) - 10px);
    }
    left: 0;
    width: 100%;
    /* Dynamically calculate height */
    height: calc(100vh - var(--navbar-height));
     .navbar.scrolled & {
        height: calc(100vh - (var(--navbar-height) - 10px));
     }
    background-color: var(--white);
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 30px;
    /* Slide in from right effect */
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out, top 0.3s ease; /* Add top transition */
    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
    overflow-y: auto; /* Allow scroll if menu is long */
    z-index: 1029; /* Below navbar, above content */
  }
  /* Make nav-menu visible when mobile-open class is added to header */
  .navbar.mobile-open .nav-menu {
      transform: translateX(0);
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
    border-bottom: 1px solid var(--border-color);
  }
   .nav-links li:last-child {
       /* No border for last standard item OR last visible item */
   }
   /* Remove border from dropdown container itself in mobile */
   .nav-links li.dropdown {
       border-bottom: none;
   }

  /* Adjust link padding for mobile */
  .nav-links li a,
  .nav-links li > .router-link,
  .nav-links li > .dropdown-toggle { /* Include dropdown toggle */
    display: block;
    padding: 18px 10px; /* Adjust padding */
    width: 100%;
    font-size: 1.05rem;
    position: relative; /* Needed for caret absolute positioning */
    font-weight: 500;
  }
   /* Hide underline effect on mobile */
   .nav-links li a::after,
   .nav-links li > .router-link::after {
       display: none;
   }
   .nav-links li a:hover,
   .nav-links li > .router-link:hover,
   .nav-links li .router-link-active {
       color: var(--primary-color); /* Simple color change on hover/active */
   }


  /* --- Mobile Dropdown Specific Styles --- */
  .nav-item.dropdown {
      position: static; /* Reset position for mobile */
      width: 100%;
  }
  /* Style mobile dropdown toggle like other mobile links */
  .nav-links li.dropdown > .dropdown-toggle {
     /* Use parent li border */
     border-bottom: none; /* Remove its own border if li has one */
  }
  .dropdown-toggle .dropdown-caret {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      transition: transform 0.3s ease;
      margin-left: 0; /* Reset margin */
      font-size: 1em; /* Make caret slightly larger */
  }
  .nav-item.dropdown.open .dropdown-caret {
      transform: translateY(-50%) rotate(180deg); /* Adjust rotation */
  }

  .dropdown-menu {
      /* Reset desktop positioning & appearance */
      position: static;
      display: none; /* Still hidden by default */
      width: 100%;
      background-color: #f8f9fa; /* Slightly different background for nesting */
      border: none;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
      margin: 0;
      opacity: 1;
      visibility: visible;
      transform: none;
      /* Use max-height for smooth slide down/up */
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      border-bottom: 1px solid var(--border-color); /* Add border below the whole dropdown */
  }
  /* Show mobile dropdown menu */
  .dropdown-menu.show {
      display: block; /* Need block for max-height transition */
      max-height: 500px; /* Or a sufficiently large value */
  }
  .dropdown-menu li {
      border-bottom: 1px dotted #ddd; /* Separator inside dropdown */
  }
   .dropdown-menu li:last-child {
       border-bottom: none;
   }
  .dropdown-menu li a,
  .dropdown-menu li > .router-link {
      padding: 15px 20px; /* Adjust padding */
      font-size: 0.95rem;
      text-align: center; /* Center text */
      background-color: transparent; /* Ensure no hover background persists */
      color: var(--text-color);
      font-weight: 400;
  }
  .dropdown-menu li a:hover,
  .dropdown-menu li > .router-link:hover,
  .dropdown-menu li .router-link-active {
      background-color: rgba(0, 123, 255, 0.05); /* Lighter hover/active */
      color: var(--primary-color);
  }

  /* Show mobile-specific items and style them */
  .nav-login-mobile,
  .nav-user-mobile {
      display: flex; /* Use flex for centering content */
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-top: none;
      margin-top: 0;
      padding: 20px 0; /* More padding */
      border-bottom: none; /* Ensure no double borders */
      width: 100%;
  }
  /* Make last REAL item have no border */
  .nav-links li:has(+ .nav-login-mobile),
  .nav-links li:has(+ .nav-user-mobile),
  .nav-links li.dropdown:has(+ .nav-user-mobile) { /* Check if dropdown is last before user */
      border-bottom: none;
  }
  .login-btn-mobile {
    display: inline-block; /* Allow centering */
    width: auto; /* Let button size naturally or set specific width */
    min-width: 150px;
    margin-top: 10px; /* Space from potential text */
    padding: 10px 20px;
    text-align: center;
    font-size: 1rem;
  }
   .nav-user-mobile span {
       display: block;
       margin-bottom: 15px; /* More space */
       font-size: 1rem;
       color: var(--text-color);
       text-align: center;
       font-weight: 500;
   }
  .btn-logout-mobile {
    padding: 10px 20px;
    width: auto; /* Let button size naturally */
    min-width: 150px;
    margin: 0 auto; /* Center button */
    background: var(--accent-color);
    color: var(--white);
    border: none;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
    display: inline-block; /* Ensure it's inline-block for centering */
  }
  .btn-logout-mobile:hover {
    background: var(--accent-dark);
  }


  /* --- Final Mobile Adjustments --- */
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