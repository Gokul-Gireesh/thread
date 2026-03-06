export class Memory {
  constructor(size = 1) {
    this.buffer = new SharedArrayBuffer(4 + size);
    this.view = new Uint8Array(this.buffer, 4, size);
    this.lock = new Int32Array(this.buffer, 0, 1);
  }

  async await(fn) {
    if(Atomics.compareExchange(this.lock, 0, 0, 1)) {
      const signal = Atomics.waitAsync(this.lock, 0, 1);
      if(signal.async) await signal.value;
      return this.await(fn);
    }
    if (fn) {
      try {
        await fn(this.view);
      } finally {
        this.lock[0] = 0;
        Atomics.notify(this.lock, 0, 1);
      }
    } else {
      this.lock[0] = 0;
      Atomics.notify(this.lock, 0, 1);
      return this.view.slice();
    }
  }
}