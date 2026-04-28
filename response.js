export class Response {
  constructor(interceptor = () => {}) {
    this._interceptor = interceptor;
  }

  send(body, transfer = []) {
    this._interceptor(body, 0, transfer);
  }
  
  write(body, transfer = []) {
    return this._interceptor(body, 1, transfer);
  }

  end(body, transfer = []) {
    return this._interceptor(body, 0, transfer);
  }
}