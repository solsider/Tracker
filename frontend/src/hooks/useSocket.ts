import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setConnected, addToast } = useRealtimeStore();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    connectSocket();
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNotification = (data: { message: string }) => {
      addToast(data.message, 'info');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotification);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', onNotification);
    };
  }, [isAuthenticated, setConnected, addToast]);
}
