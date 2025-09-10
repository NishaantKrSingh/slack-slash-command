// server.js
import 'dotenv/config'; // loads .env into process.env
import app from './api/slack.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local server listening on http://localhost:${PORT}`);
  console.log(`Slack endpoint (local): POST http://localhost:${PORT}/`);
  console.log(`Test endpoint (local):  GET http://localhost:${PORT}/test`);
});
