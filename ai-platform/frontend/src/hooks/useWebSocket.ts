import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

interface UseWebSocketOptions {
  url: string;
  onMessage: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket({ url, onMessage, onOpen, onClose }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  onMessageRef.current = onMessage;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  useEffect(() => {
    let destroyed = false;
    let retryCount = 0;

    function connect() {
      if (destroyed) return;

      logger.info('WebSocket', `Connecting... (attempt: ${retryCount + 1}) � ${url}`);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount = 0;
        logger.system('WebSocket', 'Connection established. ?');
        onOpenRef.current?.();
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as Record<string, unknown>;
          logger.debug('WebSocket', `Message received | type: ${data.type}`);
          onMessageRef.current(data);
        } catch {
          logger.error('WebSocket', 'Parse error', e.data);
        }
      };

      ws.onerror = () => {
        logger.error('WebSocket', 'Connection error');
      };

      ws.onclose = (e) => {
        retryCount++;
        logger.warn('WebSocket', `Connection closed | code: ${e.code} | ${retryCount}. Test, 3 seconds later...`);
        onCloseRef.current?.();
        if (!destroyed) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };
    }

    logger.system('App', '=== DevOps Flight Simulator ba�lat�ld� ===');
    logger.info('App', `Backend: http://localhost:8002`);
    logger.info('App', `WebSocket: ${url}`);
    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [url]);

  function send(data: unknown) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logger.debug('WebSocket', 'Mesaj g�nderiliyor', data);
      wsRef.current.send(JSON.stringify(data));
    } else {
      logger.warn('WebSocket', 'Mesaj g�nderilemedi � ba�lant� kapal�');
    }
  }

  return { send };
}
