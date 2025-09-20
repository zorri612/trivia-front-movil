// src/socket.js
import { io } from "socket.io-client";

// ⚠️ Asegúrate de usar la URL de tu backend
const socket = io("https://trivia-backend-omega.vercel.app/", {
  transports: ["websocket"],
});

export default socket;
