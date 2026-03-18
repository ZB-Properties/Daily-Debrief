// Dynamic import of simple-peer to avoid SSR issues
let Peer = null;

export const getPeer = async () => {
  if (!Peer) {
    // Set up global shims
    if (typeof window !== 'undefined') {
      window.global = window;
      window.Buffer = window.Buffer || require('buffer').Buffer;
      window.process = window.process || { env: {} };
    }
    
    const SimplePeer = await import('simple-peer');
    Peer = SimplePeer.default;
  }
  return Peer;
};

export default getPeer;