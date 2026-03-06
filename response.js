export class Response {
  constructor(interceptor = () => {}) {
    this.headers = {
      status: 200,
      type: 'json',
    };
    this.body = '';
    this.interceptor = interceptor;
  }

  status(code) {
    this.set('status', code);
    return this;
  }

  set(key, value) {
    this.headers[key] = value;
    return this;
  }

  send(body) {
    this.interceptor({
      headers: this.headers,
      body: body,
    });
  }

  json(data) {
    this.set('stream', false);
    this.set('type', 'json');
    return this.send(JSON.stringify(data));
  }

  string(data) {
    this.set('stream', false);
    this.set('type', 'string');
    return this.send(String(data));
  }

  binary(data) {
    this.set('stream', false);
    this.set('type', 'binary');
    return this.send(data);
  }

  msgpack(data) {
    this.set('stream', false);
    this.set('type', 'msgpack');
    return this.send(data);
  }

  stream(data) {
    this.set('stream', true);
    return this.send(data);
  }

  end() {
    this.set('stream', false);
    this.set('type', null);
    return this.send(null);
  }
}
