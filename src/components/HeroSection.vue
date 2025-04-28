<template>
  <!-- Tambahkan style binding untuk background image -->
  <section
    id="hero"
    class="hero"
    :style="{ backgroundImage: `url('/bg.jpg')` }"
  >
    <div class="hero-overlay"></div>
    <div class="container hero-content">
      <h1 class="hero-title" data-aos="fade-down" data-aos-delay="100">Ekspresikan Gaya <span class="highlight">Unikmu</span></h1>
      <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="300">Temukan koleksi terbaru kami yang dirancang untuk jiwa mudamu yang bebas.</p>
      <a href="#featured" class="btn btn-primary hero-cta" data-aos="fade-up" data-aos-delay="500">Jelajahi Sekarang <i class="fas fa-arrow-right"></i></a>
    </div>
    <a href="#featured" class="scroll-down-indicator" aria-label="Scroll down">
        <i class="fas fa-chevron-down"></i>
    </a>
  </section>
</template>

<script setup>
// import { onMounted } from 'vue'; // Hanya jika Anda benar-benar membutuhkannya
// import AOS from 'aos'; // Jika pakai AOS
// import 'aos/dist/aos.css'; // Jika pakai AOS

// onMounted(() => {
//     console.log("Hero mounted");
//     // AOS.init({ duration: 800, once: true }); // Jika pakai AOS
// });
</script>

<style scoped>
.hero {
  position: relative;
  height: 100vh;
  min-height: 600px;
  /* Hapus background dari CSS */
  /* background: url('/hero-bg.jpg') no-repeat center center/cover; */
  background-repeat: no-repeat; /* Tambahkan properti background lain jika perlu */
  background-position: center center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--white);
}

/* --- Style Hero lainnya (tetap sama seperti sebelumnya) --- */
.hero-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)); z-index: 1; }
.hero-content { position: relative; z-index: 2; max-width: 800px; }
.hero-title { font-size: 4rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.2; text-shadow: 2px 2px 8px rgba(0,0,0,0.5); }
.highlight { background: linear-gradient(90deg, var(--accent-color), var(--secondary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text transparent; padding: 0 5px; }
.hero-subtitle { font-size: 1.3rem; margin-bottom: 2.5rem; opacity: 0.9; max-width: 600px; margin-left: auto; margin-right: auto; color: var(--white); }
.hero-cta { font-size: 1.1rem; padding: 15px 40px; }
.hero-cta i { margin-left: 8px; transition: transform 0.3s ease; }
.hero-cta:hover i { transform: translateX(5px); }
.scroll-down-indicator { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 2; color: rgba(255, 255, 255, 0.7); font-size: 1.5rem; animation: bounce 2s infinite; cursor: pointer; }
.scroll-down-indicator:hover { color: var(--white); }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); } 40% { transform: translateX(-50%) translateY(-10px); } 60% { transform: translateX(-50%) translateY(-5px); } }
@media (max-width: 768px) { .hero { min-height: 500px; } .hero-title { font-size: 2.8rem; } .hero-subtitle { font-size: 1.1rem; } .hero-cta { font-size: 1rem; padding: 12px 30px; } }
@media (max-width: 480px) { .hero-title { font-size: 2.2rem; } .hero-subtitle { font-size: 1rem; } }
</style>