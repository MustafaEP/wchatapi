import express from 'express';
const app = express();
app.use(express.json());

app.post('/hook', (req, res) => {
  console.log('\nWEBHOOK:', JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(4000, () => console.log('Listener: http://localhost:4000/hook'));