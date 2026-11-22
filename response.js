export class Response {
  constructor(interceptor = () => {}) {
    this._interceptor = interceptor;
  }

  send(body, transfer = []) {
    this._interceptor(body, 1, transfer);
  }

  write(body, transfer = []) {
    this._interceptor(body, 0, transfer);
  }

  end(body, transfer = []) {
    this._interceptor(body, 1, transfer);
  }
}