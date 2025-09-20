// src/socket.js
import { io } from "socket.io-client";

// ⚠️ Asegúrate de usar la URL de tu backend
const socket = io("http://localhost:4000", {
  transports: ["websocket"],
});

export default socket;
