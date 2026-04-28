import { Route } from './$.js';

export class Router {
  constructor() { this.stack = []; }
  use(path, ...handlers) {
    const routePath = typeof path === 'string' ? path : '/';
    const fns = typeof path === 'string' ? handlers : [path, ...handlers];
    fns.forEach(fn => this.stack.push({ path: routePath, handler: fn, method: null }));
  }
  get(path, handler) { this.stack.push({ path, handler, method: 'GET' }); }
  post(path, handler) { this.stack.push({ path, handler, method: 'POST' }); }
  put(path, handler) { this.stack.push({ path, handler, method: 'PUT' }); }
  delete(path, handler) { this.stack.push({ path, handler, method: 'DELETE' }); }

  async _handle(req, res, path, index = 0, error = null) {
    if (index >= this.stack.length) return;
    const layer = this.stack[index];
    const errorWare = layer.handler.length === 4;

    if ((error && !errorWare) || (!error && errorWare)) {
      return await this._handle(req, res, path, index + 1, error);
    }
    
    const method = !layer.method || layer.method === req.method;
    const match = method && ((layer.path instanceof Route && layer.path.match(path)) || layer.path === '/' || path === layer.path || path.startsWith(layer.path + '/'));
    
    if (match) {
      req.params = { ...req.params, ...match.params };
      try {
        if (layer.handler instanceof Router) {
          const subPath = path.slice(layer.path.length) || '/';
          await layer.handler._handle(req, res, subPath, 0, error);
        } else {
          const next = async (e) => await this._handle(req, res, path, index + 1, e || error);
          await layer.handler(req, res, next, error);
        }
      } catch (e) {
        await this._handle(req, res, path, index + 1, e);
      }
    } else { 
      await this._handle(req, res, path, index + 1, error);
    }
  }
}