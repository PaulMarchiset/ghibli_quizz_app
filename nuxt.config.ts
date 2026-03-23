// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";


export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ]
  },
  nitro: {
    experimental: {
      websocket: true
    }
  },
  plugins: ['~/plugins/socket.ts'],
  runtimeConfig: {
    apiUrl: "https://ghibliapi.vercel.app/",
    characterApiUrl: "https://api.jikan.moe/v4/characters",
    public: {
      socketUrl: 'http://localhost:4001'
    }
  },
  app: {
    head: {
      title: "Studio Ghibli Quiz",
      meta: [
        { name: "description", content: "A quiz game about Studio Ghibli films and characters." },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    }
  }
})
