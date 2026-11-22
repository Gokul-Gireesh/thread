import { Master, _ } from '../node.js';

const app = new Master();

app.get(_`/hello/:name`, (req, res) => {
  const { name } = req.getParams();
  res.send(`hello ${name}`);
});

app.post(_`/echo`, (req, res) => {
  res.send(req.body);
});

app.get(_`/sum/:a/:b`, (req, res) => {
  const { a, b } = req.getParams();
  res.send(Number(a) + Number(b));
});

app.put(_`/fail`, (req, res, next) => {
  next(new Error('intentional'));
});

app.listen();