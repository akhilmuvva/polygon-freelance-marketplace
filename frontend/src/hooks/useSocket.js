import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
    // Use the same base URL as the API, but strip the /api path
    const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    // Socket.io expects HTTP/HTTPS URLs — it handles the WS upgrade internally
    return envUrl.replace(/\/api\/?$/, '');
};

const SOCKET_URL = getSocketUrl();

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('[Socket] Connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('[Socket] Connection Error:', err);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const subscribeToEvents = useCallback((callback) => {
        if (!socket) return;
        socket.on('NEW_BLOCKCHAIN_EVENT', callback);
        return () => socket.off('NEW_BLOCKCHAIN_EVENT', callback);
    }, [socket]);

    return { socket, isConnected, subscribeToEvents };
};
