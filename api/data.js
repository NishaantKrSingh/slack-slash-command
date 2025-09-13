export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Received data:', req.body);
    res.status(200).send('Data received successfully');
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
