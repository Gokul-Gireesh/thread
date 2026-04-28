import { parentPort } from 'node:worker_threads';
import { Router } from './router.js';
import { Request } from './request.js';
import { Response } from './response.js';
import { Queue } from './queue.js';

export class Master extends Router {
  constructor() {
    super();
    this._pending = new Map();
    this._waiting = new Map();
  }
  listen() {
    parentPort.on('message', ({path, headers, body}) => {
      const view = new DataView(headers);
      const head = view.getUint16(0, true);
      const method = ['GET', 'POST', 'PUT', 'DELETE'][(head >> 13) & 3];
      const id = head & 0xfff;
      
      if (!this._pending.has(id)) this._pending.set(id, new Queue());

      const stream = !!(head >> 15);
      const req = new Request({path, method, body, stream});
      
      const res = new Response((body, stream = 0, transfer = []) => {
        const headers = (stream << 15) | (id);
        
        this._pending.get(id).push({ headers, body, transfer });
        this._next(id);
      });
      
      this._waiting.set(id, headers);
      if (stream) {
        this._next(id);
      } else {
        this._pending.set(id, new Queue());
        this._handle(req, res, path);
      }
    });
  }
  _next(id) {
    const waiting = this._waiting.get(id);
    if (waiting) {
      const pending = this._pending.get(id).shift();
      if (pending) {
        const view = new DataView(waiting);
        view.setUint16(0, pending.headers, true);
        parentPort.postMessage({
          body: pending.body,
          headers: waiting
        }, [waiting, ...pending.transfer]);
        this._waiting.delete(id);
      }
    }
  }
}