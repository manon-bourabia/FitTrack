import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate', // Met à jour le SW automatiquement en arrière-plan
            includeAssets: ['favicon.svg', 'pwa-icon-192.png', 'pwa-icon-512.png'],
            manifest: {
                name: 'FitTrack',
                short_name: 'FitTrack',
                description: 'Suivi de tes entraînements et de ta progression',
                theme_color: '#0F172A',
                background_color: '#0F172A',
                display: 'standalone', // Plein écran sans barre du navigateur
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                lang: 'fr',
                icons: [
                    {
                        src: 'pwa-icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable', // Icône adaptative Android
                    },
                ],
            },
            workbox: {
                // Met en cache les assets statiques (JS, CSS, images)
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
                // Les appels API ne sont PAS mis en cache (données toujours fraîches)
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api/],
            },
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://backend:5000',
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 4173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
});
