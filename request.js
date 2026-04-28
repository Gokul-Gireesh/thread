import { URLSearchParams } from 'node:url';

export class Request {
  constructor({ path, method, body, stream }) {
    this.path = path || '/';
    this.method = method || 'GET';
    this.body = body;
    this.stream = stream;
    this.params = {};
    this.searchParams = new URLSearchParams(path.split('?')[1]);
  }
}