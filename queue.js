class Node {
  constructor(val) {
    this.value = val;
    this.next = null;
  }
}

export class Queue {
  constructor() {
    this.first = null;
    this.last = null;
    this.length = 0;
  }
  push(val) {
    const node = new Node(val);
    if (!this.first) this.first = this.last = node;
    else this.last = this.last.next = node;
    return ++this.length;
  }
  shift() {
    if (!this.first) return null;
    const value = this.first.value;
    this.first = this.first.next;
    this.length--;
    if (this.length === 0) this.last = null;
    return value;
  }
}