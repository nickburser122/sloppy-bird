export class Pool {
  constructor(size, create, reset) {
    this.size = size;
    this.reset = reset;
    this.active = new Array(size).fill(null);
    this.free = new Array(size);
    for (let i = 0; i < size; i++) this.free[i] = create();
    this.count = 0;
    this.freeCount = size;
  }

  acquire() {
    if (this.freeCount === 0) return null;
    const o = this.free[--this.freeCount];
    this.free[this.freeCount] = null;
    this.active[this.count++] = o;
    if (this.reset) this.reset(o);
    return o;
  }

  removeAt(i) {
    const o = this.active[i];
    this.active[i] = this.active[--this.count];
    this.active[this.count] = null;
    this.free[this.freeCount++] = o;
  }

  release(o) {
    for (let i = 0; i < this.count; i++) {
      if (this.active[i] === o) {
        this.removeAt(i);
        return true;
      }
    }
    return false;
  }

  update(fn) {
    for (let i = this.count - 1; i >= 0; i--) {
      if (fn(this.active[i], i) === false) this.removeAt(i);
    }
  }

  releaseAll() {
    while (this.count > 0) this.removeAt(this.count - 1);
  }
}
