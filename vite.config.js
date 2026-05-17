import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg'], // Menyertakan SVG bawaan
      manifest: {
        name: "Pembimbingta' - Bimbingan Skripsi",
        short_name: "Pembimbingta'",
        description: "Aplikasi bimbingan skripsi cerdas untuk mahasiswa dan dosen",
        theme_color: "#2563eb", // Warna biru tema aplikasi
        background_color: "#F8F9FE", // Warna background aplikasi
        display: "standalone", // Membuatnya tampil full screen tanpa URL bar browser
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Agar bentuk ikon bisa menyesuaikan tema HP
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      // Mengarahkan semua request '/api/nvidia' ke server asli NVIDIA (Agar tidak error CORS)
      '/proxy-ai': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, '')
      }
    }
  }
})
