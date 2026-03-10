# thread

A routing and RPC layer for **Node.js Worker Threads** that uses a custom binary protocol to keep communication overhead as low as possible.

Created by **Gokul-Gireesh (@Gokul-Gireesh)**, `thread` provides an Express-like API for workers, packing request metadata into a 2-byte header.

## Features

-   **Bitwise Messaging**: Encodes Request ID, Method, and Data Type into a tiny 2-byte header.
-   **Express-style Router**: Full support for `.get()`, `.post()`, `.use()`, and nested routing logic.
-   **Middleware Engine**: Sequential execution with `next()` and dedicated 4-argument error handling.
-   **Promise-based Fetch**: Familiar `fetch()` API on the Master thread for seamless worker interaction.
-   **Efficient Queuing**: Internal scheduler handles up to 1024 concurrent requests with automatic ID recycling.

## Installation

```bash
npm install Gokul-Gireesh/thread
```

## Quick Start

### 1. The Worker (`worker.js`)
Extend the `Slave` class to build your background API.

```javascript
import { Slave } from '@gokul-gireesh/thread';

const worker = new Slave();

// Middleware example
worker.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Route definition
worker.get('/compute', (req, res) => {
  res.send({ 
    message: 'Task complete',
    duration: Date.now() - req.startTime 
  });
});

worker.listen();
```

### 2. The Main Thread (`main.js`)
Use the `Master` class to interact with your worker file.

```javascript
import { Master } from '@gokul-gireesh/thread';

const master = new Master('./worker.js');

const res = await master.fetch('/compute');
console.log(res.body); 
// Output: { message: 'Task complete', duration: ... }
```

## The Binary Protocol

`thread` packs metadata into a `Uint16` header to bypass the serialization bottlenecks of standard `postMessage`.

| Bits | Field | Details |
| :--- | :--- | :--- |
| **0-9** | **ID** | Unique identifier (upto 1024) |
| **10-11** | **Method** | GET (0), POST (1), PUT (2), DELETE (3) |
| **12** | **-** | *Reserved* |
| **13** | **Stream** | Binary flag for chunked data |
| **14-15** | **Type** | JSON (0), String (1), Binary (2), MsgPack (3) |

## Advanced Routing

You can nest routers to keep your worker code modular:

```javascript
import { Router, Slave } from '@gokul-gireesh/thread';

const apiV1 = new Router();
apiV1.get('/users', (req, res) => res.send([{ id: 1 }]));

const worker = new Slave();
worker.use('/v1', apiV1); // Accessible via /v1/users
worker.listen();
```

## API Reference

### `Master` (Main Thread)
- `new Master(path)`: Spawns a worker thread.
- `fetch(path, options)`: Sends a message and returns a `Promise`.

### `Slave` (Worker Thread)
- `listen()`: Starts the worker listener.
- `get|post|put|delete(path, handler)`: Standard routing methods.
- `use(path, ...handlers)`: Mounts middleware, sub-routers, or error handlers.

## Contributing
Contributions are welcome! Check out the [GitHub repository](https://github.com/Gokul-Gireesh/thread).

## License
MIT @ Gokul-Gireesh
