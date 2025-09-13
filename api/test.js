export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ message: 'API is working!' });
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
