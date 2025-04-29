import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Make sure this path is correct
import './assets/main.css'
const app = createApp(App);
app.use(router); // <<< THIS LINE IS CRUCIAL
app.mount('#app');