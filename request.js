export class Request {
  constructor({ path, method, body }) {
    this.path = path || '/';
    this.method = method || 'GET';
    this.body = body;
  }

  getParams() {
    return null;
  }

  getSearchParams() {
    return null;
  }
}