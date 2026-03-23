const ICE_SERVERS = [
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: 'd5cbf9df7f8e9b3370b63e90',
    credential: '3+Qn6DVyGOP0Lxaf',
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: 'd5cbf9df7f8e9b3370b63e90',
    credential: '3+Qn6DVyGOP0Lxaf',
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: 'd5cbf9df7f8e9b3370b63e90',
    credential: '3+Qn6DVyGOP0Lxaf',
  },
  {
    urls: 'turns:global.relay.metered.ca:443?transport=tcp',
    username: 'd5cbf9df7f8e9b3370b63e90',
    credential: '3+Qn6DVyGOP0Lxaf',
  },
];

export const PEER_OPTIONS = {
  host: '0.peerjs.com',
  port: 443,
  secure: true,
  path: '/',
  debug: 2,
  config: {
    iceServers: ICE_SERVERS,
  },
};
