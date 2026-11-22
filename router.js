import { Route } from './route.js';

export class Router {
  constructor() {
    this._stack = {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: []
    };
  }
  use(...handlers) {
    handlers.forEach(handler => {
      const layer = { path: '/', handler };
      this._stack.GET.push(layer);
      this._stack.POST.push(layer);
      this._stack.PUT.push(layer);
      this._stack.DELETE.push(layer);
    });
  }
  all(path, ...handlers) {
    handlers.forEach(handler => {
      const layer = { path, handler };
      this._stack.GET.push(layer);
      this._stack.POST.push(layer);
      this._stack.PUT.push(layer);
      this._stack.DELETE.push(layer);
    });
  }
  get(path, handler) { this._stack.GET.push({ path, handler }); }
  post(path, handler) { this._stack.POST.push({ path, handler }); }
  put(path, handler) { this._stack.PUT.push({ path, handler }); }
  delete(path, handler) { this._stack.DELETE.push({ path, handler }); }

  _push(layer) {
    this._stack.GET.push(layer);
    this._stack.POST.push(layer);
    this._stack.PUT.push(layer);
    this._stack.DELETE.push(layer);
  }

  _handle(req, res, path, method, index = 0, error = null) {
    const stack = this._stack[method];
    if (index >= stack.length) return () => this._next(error);
    const layer = stack[index];
    const errorWare = layer.handler.length === 5;

    if ((error && !errorWare) || (!error && errorWare)) {
      return () => this._handle(req, res, path, method, index + 1, error);
    }

    const match = (layer.path instanceof Route && layer.path.match(path)) || layer.path === '/' || path === layer.path || path.startsWith(layer.path + '/');

    if (match) {
      //req.params = { ...req.params, ...layer.path.params };
      req.getParams = () => layer.path.getParams();
      req.getSearchParams = () => layer.path.getSearchParams();
      if (layer.handler instanceof Router) {
        layer.handler._next = (e) => this._handle(req, res, path, method, index + 1, e ?? error);
        const subPath = path.slice(layer.path.length) || '/';
        return () => layer.handler._handle(req, res, subPath, method, 0, error);
      } else {
        const next = (e) => this._handle(req, res, path, method, index + 1, e ?? error);
        return () => layer.handler(req, res, next, this._next, error);
      }
    } else {
      return () => this._handle(req, res, path, method, index + 1, error);
    }
  }

  _next(e) {
    if (e) throw e;
    throw new Error('Uncaught Route: please provide a generic handler for catching all uncaught routes.');
  }
}