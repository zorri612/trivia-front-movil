// src/socket.js
import { io } from "socket.io-client";

// ⚠️ Asegúrate de usar la URL de tu backend
const socket = io("http://52.23.197.194/", {
  transports: ["websocket"],
});

export default socket;
