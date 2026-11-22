import { parentPort } from 'node:worker_threads';
import { Router } from './router.js';
import { Request } from './request.js';
import { Response } from './response.js';

const methods = {
  1: 'GET',
  2: 'POST',
  3: 'PUT',
  4: 'DELETE'
};

export class Master extends Router {
  constructor() {
    super();
    this._pending = new Map();
  }
  listen() {
    parentPort.on('message', (message) => this._onMessage(message));
    parentPort.postMessage({});
  }
  _onMessage({path, headers, body}) {
    const view = new DataView(headers);
    const head = view.getUint16(0, true);
    const flag = (head >> 12);
    const id = head & 0xfff;

    if (flag) {
      const method = methods[flag];
      const req = new Request({path, method, body});
      const res = new Response((body, flag = 0, transfer = []) => {
        view.setUint16(0, (flag << 12) | id, true);
        parentPort.postMessage({headers, body}, [headers, ...transfer]);
        if (flag) return;
        const deferred = Promise.withResolvers();
        this._pending.set(id, {
          resolve: deferred.resolve,
          reject: deferred.reject
        });
        return deferred.promise;
      });
      let result = this._handle(req, res, path, method);
      while (typeof result === 'function') result = result();
      return;
    }
    this._pending.get(id).resolve(body);
  }
}