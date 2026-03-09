import { defineNuxtPlugin } from "#app";
import { io } from "socket.io-client";

export default defineNuxtPlugin((nuxtApp) => {
  // Ensure we only initialize the WebSocket client on the client-side
  if (process.client) {
    const socket = io("http://localhost:3000", {
      transports: ["websocket"], // Ensure WebSocket is used
    });
    console.log("WebSocket client initialized.");

    // Inject `socket` so you can access it with `nuxtApp.$socket` in your app
    nuxtApp.provide("socket", socket);
  }
});