<template>
  <div>
    <!-- Include the sections that belong on the public landing page -->
    <HeroSection />
    <FeaturedProducts id="featured" />
    <BrandSection id="brand" />
    <CtaSection id="cta" />
    <!-- Add any other non-authenticated content here -->
  </div>
</template>

<script setup>
// Import the necessary section components
import HeroSection from '@/components/HeroSection.vue'; // Adjust path if needed
import FeaturedProducts from '@/components/FeaturedProducts.vue';
import BrandSection from '@/components/BrandSection.vue';
import CtaSection from '@/components/CtaSection.vue';

// No specific script logic needed for just displaying sections usually
</script>

<style scoped>
/* Add any specific styles for the HomeView layout if needed */
</style>