import { Queue } from './queue.js';

export class Slave {
  constructor(path) {
    this._worker = new Worker(path, { type: 'module' });
    this._pending = new Map();
    this._scheduler = new Queue();
    this._free = [];
    this._countdown = 4096;
    
    this._worker.onmessage = ({data: {headers, body}}) => {
      const head = new DataView(headers).getUint16(0, true);
      const id = head & 0xfff;
      const stream = (head >> 15);

      const promise = this._pending.get(id);
      if (!promise) return;

      const res = {
        body
      };

      if (stream) {
        const deferred = Promise.withResolvers();
        this._pending.set(id, {
          resolve: deferred.resolve,
          reject: deferred.reject
        });
        res.stream = deferred.promise;
        promise.resolve(res);
        this._worker.postMessage({headers}, [headers]);
      } else {
        promise.resolve(res);
        this._pending.delete(id);
        this._free.push(id);
        this._next();
      }
    };
  }

  _next() {
    if (this._scheduler.length === 0) return;
    
    let id;
    if (this._free.length > 0) id = this._free.pop();
    else if (this._countdown > 0) id = --this._countdown;
    else return;

    const {path, method, body, transfer, resolve, reject} = this._scheduler.shift();

    const methods = { GET: 0, POST: 1, PUT: 2, DELETE: 3 };
    
    const head = (methods[method] << 13) | id;
    const headers = new ArrayBuffer(2);
    new DataView(headers).setUint16(0, head, true);

    this._pending.set(id, {resolve, reject});
    this._worker.postMessage({path, headers, body}, [headers, ...transfer]);
  }

  fetch(path, {method = 'GET', body, transfer = []} = {}) {
    return new Promise((resolve, reject) => {
      this._scheduler.push({path, method, body, transfer, resolve, reject});
      this._next();
    });
  }
}