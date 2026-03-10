import { parentPort } from 'node:worker_threads';
import { Router } from './router.js';
import { Request } from './request.js';
import { Response } from './response.js';
import { Queue } from './queue.js';

export class Slave extends Router {
  constructor() {
    super();
    this.pending = new Map();
    this.waiting = new Map();
  }
  listen() {
    parentPort.on('message', async ({path, headers, body}) => {
      const view = new DataView(headers);
      const head = view.getUint16(0, true);
      const types = ['json', 'string', 'binary', 'msgpack'];
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const id = head & 0x3ff;
      
      if (!this.pending.has(id)) this.pending.set(id, new Queue());

      const method = (head >> 10) & 3;
      const Headers = {
        id,
        stream: !!((head >> 13) & 1),
        type: types[((head >> 14) & 3)],
        status: 200
      };
      const Method = methods[method];
      const req = new Request({path, method: Method, headers: Headers, body});
      
      const res = new Response((load) => {
        const types = { json: 0, string: 1, binary: 2, msgpack: 3 };
        const type = types[load.headers.type] ?? 1;
        const stream = load.headers.stream ? 1 : 0;
        const custom = load.headers.custom & 3;
        
        const head = (type << 14) | (stream << 13) | (custom << 10) | (id);
        
        this.pending.get(id).push({ headers: head, body: load.body });
        this._next(id);
      });
      
      this.waiting.set(id, headers);
      if (Headers.stream) {
        this._next(id);
      } else {
        this.pending.set(id, new Queue());
        await this._handle(req, res, path);
        res.end();
      }
    });
  }
  _next(id) {
    const waiting = this.waiting.get(id);
    if (waiting) {
      const pending = this.pending.get(id).shift();
      if (pending) {
        const view = new DataView(waiting);
        view.setUint16(0, pending.headers, true);
        parentPort.postMessage({
          body: pending.body,
          headers: waiting
        }, [waiting]);
        this.waiting.delete(id);
      }
    }
  }
}