import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from './components/LandingPage.vue';
import HomeView from './views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    props: route => ({ processing: route.query.processing, processingMessage: route.query.processingMessage })
  },
  {
    path: '/main',
    name: 'Main',
    component: HomeView,
    props: route => ({ initialUploadedFile: route.state?.uploadedFile })
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 