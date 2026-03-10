export class Response {
  constructor(interceptor = () => {}) {
    this.headers = {
      status: 200,
      type: 'json',
      stream: 'true'
    };
    this.body = '';
    this.interceptor = interceptor;
  }

  set(key, value) {
    this.headers[key] = value;
    return this;
  }

  send(body) {
    this.interceptor({
      headers: this.headers,
      body,
    });
  }

  json(data) {
    this.set('stream', true);
    this.set('type', 'json');
    return this.send(JSON.stringify(data));
  }

  string(data) {
    this.set('stream', true);
    this.set('type', 'string');
    return this.send(String(data));
  }

  binary(data) {
    this.set('stream', true);
    this.set('type', 'binary');
    return this.send(data);
  }

  msgpack(data) {
    this.set('stream', true);
    this.set('type', 'msgpack');
    return this.send(data);
  }

  end(body, type) {
    this.set('stream', false);
    this.set('type', type);
    return this.send(body);
  }
}
