<template>
  <div>
    <HeroSection />
    <FeaturedProducts id="featured" />
    <BrandSection id="brand" />
    <CtaSection id="cta" />
  </div>
</template>

<script setup>
import HeroSection from '@/components/HeroSection.vue';
import FeaturedProducts from '@/components/FeaturedProducts.vue';
import BrandSection from '@/components/BrandSection.vue';
import CtaSection from '@/components/CtaSection.vue';

</script>