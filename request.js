export class Request {
  constructor({ path, method, body, headers }) {
    this.path = path || '/';
    this.method = method || 'GET';
    this.body = body;
    this.headers = headers || {};
    this.params = {};
    this.searchParams = new URLSearchParams(path.split('?')[1]);
  }

  json() {
    try {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    } catch (e) {
      return null;
    }
  }
}