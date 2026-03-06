import { Worker } from 'node:worker_threads';
import { Queue } from './queue.js';

export class Master {
  constructor(path, memory) {
    this.worker = new Worker(path);
    this.pending = new Map();
    this.sheduler = new Queue();
    this.free = [];
    this.countdown = 1024;
    this.memory = memory;
    
    this.worker.on('message', ({headers, body}) => {
      const head = new DataView(headers).getUint16(0, true);
      const id = head & 0x3ff;
      const type = (head >> 14) & 3;
      const stream = (head >> 13) & 1;
      const custom = (head >> 10) & 3;

      const promise = this.pending.get(id);
      if (!promise) return;

      const res = {
        body,
        headers: {
          stream: !!stream,
          type: ['json', 'string', 'binary', 'msgpack'][type],
          custom
        },
      };

      if (stream) {
        const deferred = Promise.withResolvers();
        this.pending.set(id, {
          resolve: deferred.resolve,
          reject: deferred.reject
        });
        res.promise = deferred.promise;
        promise.resolve(res);
        this.worker.postMessage({headers}, [headers]);
      } else {
        promise.resolve(res);
        this.pending.delete(id);
        this.free.push(id);
        this._next();
      }
    });
  }

  _next() {
    if (this.sheduler.length === 0) return;
    
    let id;
    if (this.free.length > 0) id = this.free.pop();
    else if (this.countdown > 0) id = --this.countdown;
    else return;

    const {path, method, headers, body, resolve, reject} = this.sheduler.shift();
    const types = { json: 0, string: 1, binary: 2, msgpack: 3 };
    const methods = { GET: 0, POST: 1, PUT: 2, DELETE: 3 };
    
    const head = (types[headers?.type || 'json'] << 14) | ((headers?.stream ? 1 : 0) << 13) | (methods[method] << 10) | id;
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0, head, true);

    this.pending.set(id, {resolve, reject});
    this.worker.postMessage({path, headers: buf, body}, [buf]);
  }

  fetch(path, {method = 'GET', headers = {}, body, onStream} = {}) {
    return new Promise((resolve, reject) => {
      this.sheduler.push({path, method, headers, body, resolve, reject});
      this._next();
    });
  }
}