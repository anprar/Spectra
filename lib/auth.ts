import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET || 'spectra_super_secret_session_key_12345';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

// Base64url utilities for Edge compatibility
function base64urlEncode(str: string): string {
  const binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  });
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const utf8 = binary.split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('');
  return decodeURIComponent(utf8);
}

// Convert a string to an array buffer
function str2ab(str: string): Uint8Array {
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
}

// Import key for HMAC
async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = str2ab(SECRET);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Sign a session payload (expires in 24 hours)
export async function encryptSession(payload: SessionPayload): Promise<string> {
  const exp = Date.now() + 24 * 3600 * 1000; // 24 hours
  const tokenPayload = { ...payload, exp };
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const part1 = base64urlEncode(JSON.stringify(header));
  const part2 = base64urlEncode(JSON.stringify(tokenPayload));
  const tokenToSign = `${part1}.${part2}`;
  
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    str2ab(tokenToSign)
  );
  
  const sigStr = String.fromCharCode(...new Uint8Array(signature));
  const part3 = base64urlEncode(sigStr);
  
  return `${tokenToSign}.${part3}`;
}

// Decrypt / verify session token
export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const [part1, part2, part3] = token.split('.');
    if (!part1 || !part2 || !part3) return null;
    
    const tokenToVerify = `${part1}.${part2}`;
    const key = await getCryptoKey();
    
    const sigStr = base64urlDecode(part3);
    const sigBuf = str2ab(sigStr);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf,
      str2ab(tokenToVerify)
    );
    
    if (!isValid) return null;
    
    const payloadJson = base64urlDecode(part2);
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
    };
  } catch (e) {
    return null;
  }
}

// Set session cookie in the response (Next.js server-side)
export async function setSessionCookie(payload: SessionPayload) {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set('spectra_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 3600, // 24 hours
  });
}

// Get session payload from request cookies
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('spectra_session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

// Clear session cookie on logout
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set('spectra_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
