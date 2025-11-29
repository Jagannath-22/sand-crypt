// backend/routes/admin.mfa.js (example)
import express from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import protectAdminRoute from '../middleware/protectAdminRoute.js';
import Admin from '../models/admin.model.js';

const router = express.Router();

router.post('/setup', protectAdminRoute, async (req, res) => {
  // generate secret and return QR data
  const secret = speakeasy.generateSecret({ length: 20, name: `SandCrypt:${req.admin.username}` });
  // store secret.base32 in admin.mfaSecret (encrypted ideally)
  req.admin.mfaSecret = secret.base32;
  await req.admin.save();
  const qr = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ qr, secret: secret.base32 });
});

router.post('/verify', async (req, res) => {
  const { username, code } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin || !admin.mfaSecret) return res.status(401).json({ error: 'MFA not configured' });
  const verified = speakeasy.totp.verify({ secret: admin.mfaSecret, encoding: 'base32', token: code, window: 1});
  if (!verified) return res.status(401).json({ error: 'Invalid TOTP' });
  // on success generate cookie token
  generateAdminToken(admin._id, res);
  res.json({ success: true });
});
