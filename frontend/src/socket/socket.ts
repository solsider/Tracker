import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const base = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;
    socket = io(`${base}/realtime`, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
