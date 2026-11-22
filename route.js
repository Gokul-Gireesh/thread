export class Route {
  constructor(regex, keys) {
    this.keys = keys;
    this.regex = regex;
  }

  match(url) {
    const [path, search] = url.split('?');
    const matches = path.match(this.regex);

    if (!matches) return false;
    this.matches = matches;
    this.length = matches[0].length;
    this.path = path;
    this.search = search;

    return true;
  }

  getPath() {
    return this.path;
  }

  getParams() {
    if (this.params) return this.params;
    this.params = {};
    for (let i = 0; i < this.keys.length; i++) {
      this.params[this.keys[i]] = decodeURIComponent(this.matches[i + 1]);
    }
    return this.params;
  }

  getSearchParams() {
    if (this.searchParams) return this.searchParams;
    this.searchParams = new URLSearchParams(this.search);
    return this.searchParams;
  }
}

export function _(strings) {
  const string = strings[0];
  const keys = [];
  const pattern = string
    .replace(/:([a-zA-Z_]\w*)/g, (_, name) => {
      keys.push(name);
      return '([^/]+)';
    });

  const regex = new RegExp('^' + pattern + '(?:/|$)');
  return new Route(regex, keys);
}

export function $(strings, ...params) {
  let pattern = '';
  const keys = [];
  for (let i = 0; i < strings.length; i++) {
    pattern += strings[i];
    if (i < params.length) {
      const { key, regex } = params[i];
      keys.push(key);
      pattern += '(' + (regex || '[^/]+') + ')';
    }
  }
  const regex = new RegExp('^' + pattern + '(?:/|$)');
  return new Route(regex, keys);
}