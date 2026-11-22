import { Queue } from '../queue.js';

const methods = { GET: 1, POST: 2, PUT: 3, DELETE: 4 };

export class Slave {
  constructor(path, options) {
    this._worker = new Worker(path, options);
    this._pending = new Map();
    this._scheduler = new Queue();
    this._free = [];
    this._countdown = 4096;
    this._worker.addEventListener('message', (e) => this._onMessage(e.data));
    this._worker.addEventListener('error', (e) => this._onError(e));
  }

  kill() {
    this._worker.terminate();
    this._onError(new Error('worker terminated'));
  }

  _onError(e) {
    this._active = false;
    this.fetch = null;
    for (const [, p] of this._pending) p.reject(e);
    this._pending.clear();
    while (this._scheduler.length > 0)  this._scheduler.shift().reject(e);
  }

  _onMessage({headers, body}) {
    if (!headers) {
      this._active = true;
      while (this._next());
      return;
    }
    const head = new DataView(headers).getUint16(0, true);
    const id = head & 0xfff;
    const flag = (head >> 12);

    const promise = this._pending.get(id);
    if (!promise) return;

    const res = {
      body
    };

    if (!flag) {
      const deferred = Promise.withResolvers();
      this._pending.set(id, {
        resolve: deferred.resolve,
        reject: deferred.reject
      });
      res.stream = (ack, transfer) => {
        this._worker.postMessage({headers, body: ack}, [headers, ...transfer]);
        return deferred.promise;
      };
      promise.resolve(res);
    } else {
      promise.resolve(res);
      this._pending.delete(id);
      this._free.push(id);
      this._next();
    }
  }

  _next() {
    if (!this._active ||this._scheduler.length === 0) return false;

    let id;
    if (this._free.length > 0) id = this._free.pop();
    else if (this._countdown > 0) id = --this._countdown;
    else return false;

    const {path, method, body, transfer, resolve, reject} = this._scheduler.shift();

    const head = (methods[method] << 12) | id;
    const headers = new ArrayBuffer(2);
    new DataView(headers).setUint16(0, head, true);

    this._pending.set(id, {resolve, reject});
    this._worker.postMessage({path, headers, body}, [headers, ...transfer]);
    return true;
  }

  fetch(path, {method = 'GET', body} = {}, transfer = []) {
    return new Promise((resolve, reject) => {
      this._scheduler.push({path, method, body, transfer, resolve, reject});
      this._next();
    });
  }
}