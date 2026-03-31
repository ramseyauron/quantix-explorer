# Quantix Explorer

Blockchain explorer for the [Quantix Protocol](https://github.com/ramseyauron/quantix) — a post-quantum Layer 1 blockchain.

## Features
- 🔷 Live block list with height, hash, transactions count, timestamp
- 📦 Block detail page — all header fields, transactions table
- 💸 Transaction detail page — sender, receiver, amount, gas, nonce, signature
- 📋 All transactions page
- 🔍 Search by block height or transaction hash
- ⚡ Auto-refresh every 10s

## Setup

### Connect to a live node

Start a Quantix devnet node:
```bash
./quantix -nodes 1 -node-index 0 -roles validator \
  -datadir /tmp/qtx \
  -http-port 127.0.0.1:8560 \
  -udp-port 32421 -tcp-addr 127.0.0.1:32421
```

Set the node URL:
```env
NEXT_PUBLIC_NODE_URL=http://127.0.0.1:8560
```

### Run explorer
```bash
npm install
npm run dev
```

## Deploy

Deployed on Vercel. Set `NEXT_PUBLIC_NODE_URL` to your node's public HTTP endpoint.
