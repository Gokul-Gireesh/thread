export class Route {
  constructor(strings, keys) {
    this.keys = keys;
    this.regex = new RegExp('^' + strings.join('([^/]+)'));
  }

  match(url) {
    const [path, search] = url.split('?');
    const match = path.match(this.regex);
    
    if (!match) return null;

    const params = {};
    for (let i = 0; i < this.keys.length; i++) {
      params[this.keys[i]] = decodeURIComponent(match[i + 1]);
    }
    
    return { params, path: match[0] };
  }
}

export function $ (strings, ...keys) {
  return new Route(strings, keys);
}