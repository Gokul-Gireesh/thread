import { parentPort } from 'node:worker_threads';
import { Router } from './router.js';
import { Request } from './request.js';
import { Response } from './response.js';
import { Queue } from './queue.js';

export class Slave extends Router {
  constructor() {
    this.pending = new Map();
    this.using = new Map();
    this.waiting = new Map();
  }
  listen() {
    parentPort.on('message', ({path, headers, body}) => {
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
        
        const waiting = this.waiting.get(id);
        
        if (view.byteLength) {
          if (!stream) {
            this.pending.set(id, new Queue);
            this.using.set(id, false);
            this.waiting.delete(id);
          }
          view.setUint16(0, head, true);
          parentPort.postMessage({ 
            body: load.body, 
            headers
          }, [headers]);
        } else if (waiting?.byteLength) {
          if (!stream) {
            this.pending.set(id, new Queue);
            this.using.set(id, false);
          }
          const view = new DataView(waiting);
          view.setUint16(0, head, true);
          parentPort.postMessage({ 
            body: load.body, 
            headers: waiting
          }, [waiting]);
          this.waiting.delete(id);
        } else if (stream) {
          this.pending.get(id).push({ headers: head, body: load.body });
        }
      });
      const pending = this.pending.get(id).shift();
      const using = this.using.get(id);
      if (pending) {
        view.setUint16(0, pending.headers, true);
        parentPort.postMessage({
          body: pending.body,
          headers
        }, [headers]);
      } else if (using) {
        this.waiting.set(id, headers);
      } else {
        this.using.set(id, true);
        this._handle(req, res, path);
      }
    });
  }
}