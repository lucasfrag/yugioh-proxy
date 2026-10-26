import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Em desenvolvimento, encaminha a API e as imagens para o backend local
const API_URL = process.env.API_URL || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': API_URL,
      '/imagens': API_URL,
    },
  },
})
