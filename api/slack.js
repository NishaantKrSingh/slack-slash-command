// api/slack.js
import express from 'express';
import crypto from 'crypto';

const app = express();
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';

// Capture raw body for Slack signature verification
app.use(express.urlencoded({
  extended: true,
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.json());

const verifySlackRequest = (req, res, next) => {
  // If no signing secret set (e.g. quick local dev), skip verification
  if (!SLACK_SIGNING_SECRET) return next();

  const timestamp = req.headers['x-slack-request-timestamp'];
  const slackSignature = req.headers['x-slack-signature'];

  if (!timestamp || !slackSignature) return res.status(400).send('Bad Request');

  // Protect against replay attacks (5 minute window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 60 * 5) return res.status(400).send('Stale request');

  const sigBase = `v0:${timestamp}:${req.rawBody || ''}`;
  const mySig = `v0=${crypto.createHmac('sha256', SLACK_SIGNING_SECRET).update(sigBase).digest('hex')}`;

  try {
    const sigBuffer = Buffer.from(mySig, 'utf8');
    const slackBuffer = Buffer.from(slackSignature, 'utf8');
    if (sigBuffer.length !== slackBuffer.length) return res.status(401).send('Invalid signature');
    if (!crypto.timingSafeEqual(sigBuffer, slackBuffer)) return res.status(401).send('Invalid signature');
  } catch (err) {
    return res.status(401).send('Invalid signature');
  }

  return next();
};

// POST handler: Slack will POST here when the slash command is used.
// On Vercel this file will be exposed under: /api/slack
app.post('/', verifySlackRequest, (req, res) => {
  const { command, text, user_id, response_url } = req.body || {};

  // Immediate JSON response (must be within 3 seconds)
  return res.json({
    response_type: 'ephemeral', // "ephemeral" or "in_channel"
    text: `Received command ${command} with text: ${text || '<empty>'}`
  });

  // --- if you needed a delayed response:
  // res.status(200).send(); // acknowledge quickly
  // (async () => {
  //   try {
  //     await fetch(response_url, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ text: `Processing finished for <@${user_id}>` })
  //     });
  //   } catch (err) {
  //     console.error('Failed follow-up', err);
  //   }
  // })();
});

// Health/test endpoint
app.get('/test', (req, res) => {
  return res.json({ ok: true, now: new Date().toISOString() });
});

export default app;
