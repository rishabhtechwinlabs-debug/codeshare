import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const secret = process.env.TURN_SECRET || 'openrelayprojectsecret';
    const expiry = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const username = `${expiry}:hivecode`;
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:staticauth.openrelay.metered.ca:80' },
      {
        urls: 'turn:staticauth.openrelay.metered.ca:80',
        username,
        credential
      },
      {
        urls: 'turn:staticauth.openrelay.metered.ca:443',
        username,
        credential
      },
      {
        urls: 'turn:staticauth.openrelay.metered.ca:443?transport=tcp',
        username,
        credential
      },
      {
        urls: 'turns:staticauth.openrelay.metered.ca:443?transport=tcp',
        username,
        credential
      }
    ];

    return NextResponse.json({ iceServers });
  } catch (err) {
    return NextResponse.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
  }
}
