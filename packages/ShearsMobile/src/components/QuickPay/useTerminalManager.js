// useTerminalManager.js
import { useRef, useState, useEffect } from 'react';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';

export function useTerminalManager() {
  const [readers, setReaders] = useState([]);
  const discovering = useRef(false);
  const {
    discoverReaders,
    connectReader,
    connectedReader,
    discoveredReaders,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: setReaders,
  });

  useEffect(() => {
    if (discovering.current) return;
    discovering.current = true;

    (async () => {
      const { error } = await discoverReaders({
        discoveryMethod: 'bluetoothScan',
        simulated: true,
      });
      if (error) console.log('Discovery error:', error);
    })();
  }, [discoverReaders]);

  return { readers, connectReader, connectedReader };
}
