# @gokul-gireesh/thread

A routing and RPC layer for **Node.js Worker Threads** and **Web Workers**.

## Installation

```bash
npm install @gokul-gireesh/thread
```

## Quick Start

### 1. The Worker (`worker.js`)
```javascript
import { Master } from '@gokul-gireesh/thread';

const app = new Master();

app.get('/compute', (req, res) => {
  res.send({ result: 42 });
});

app.listen();
```

### 2. The Main Thread (`main.js`)
```javascript
import { Slave } from '@gokul-gireesh/thread';

const worker = new Slave('./worker.js');

const { body } = await worker.fetch('/compute');
console.log(body); 
```

## Binary Header Layout (Uint16)

Metadata is packed into a 2-byte header.


| Bits | Field | Details |
| :--- | :--- | :--- |
| **0-11** | **ID** | Request ID (0–4095) |
| **12** | **-** | *Reserved* |
| **13-14** | **Method** | GET (0), POST (1), PUT (2), DELETE (3) |
| **15** | **Stream** | Stream flag |

## API

### `Slave` (Main Thread)
- `new Slave(path)`: Initialize worker.
- `fetch(path, { method, body, transfer })`: Returns `Promise<{ body, stream }>`.

### `Master` (Worker Thread)
- `listen()`: Initialize listener.
- `get|post|put|delete(path, handler)`: Route handlers.
- `use(path, ...handlers)`: Middleware and sub-routers.

## Bundles
- **Node**: `nodeBundle.js`
- **Web**: `webBundle.js`

## License
MIT @ Gokul-Gireesh