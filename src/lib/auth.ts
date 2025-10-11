import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import prisma from './db';
import type { Club } from '@prisma/client';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-key-change-in-production'
);

// ============================================================================
// Club Secret Authentication
// ============================================================================

/**
 * Validate a club secret and return club if valid
 */
export async function validateClubSecret(
  secret: string
): Promise<{ valid: boolean; club?: Club; error?: string }> {
  if (!secret || secret.trim().length === 0) {
    return { valid: false, error: 'Club secret is required' };
  }

  const club = await prisma.club.findUnique({
    where: { secret },
  });

  if (!club) {
    return { valid: false, error: 'Invalid club secret' };
  }

  // Check if secret is still valid (not expired)
  const now = new Date();
  if (now < club.secretValidFrom || now > club.secretValidUntil) {
    return { valid: false, error: 'Club secret has expired' };
  }

  return { valid: true, club };
}

/**
 * Create a session token for a club
 */
export async function createClubSession(clubId: string): Promise<string> {
  const token = await new SignJWT({ clubId, type: 'club' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verify a club session token
 */
export async function verifyClubSession(
  token: string
): Promise<{ valid: boolean; clubId?: string }> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    const payload = verified.payload as { clubId: string; type: string };

    if (payload.type !== 'club') {
      return { valid: false };
    }

    return { valid: true, clubId: payload.clubId };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Set club session cookie with expiry matching the club secret validity
 */
export async function setClubSessionCookie(clubId: string): Promise<void> {
  const token = await createClubSession(clubId);
  const cookieStore = await cookies();

  // Get club to check secret expiry
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { secretValidUntil: true },
  });

  // Calculate maxAge until secret expires (or default to 30 days if not found)
  let maxAge = 30 * 24 * 60 * 60; // 30 days default
  if (club) {
    const now = new Date();
    const expiryDate = new Date(club.secretValidUntil);
    const secondsUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / 1000
    );
    // Use expiry time but cap at 1 year for sanity
    maxAge = Math.min(secondsUntilExpiry, 365 * 24 * 60 * 60);
    // Ensure at least 1 day
    maxAge = Math.max(maxAge, 24 * 60 * 60);
  }

  cookieStore.set('club_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

/**
 * Get club from session cookie
 */
export async function getClubFromSession(): Promise<Club | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('club_session');

  if (!token) {
    return null;
  }

  const verified = await verifyClubSession(token.value);
  if (!verified.valid || !verified.clubId) {
    return null;
  }

  const club = await prisma.club.findUnique({
    where: { id: verified.clubId },
  });

  return club;
}

/**
 * Clear club session
 */
export async function clearClubSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('club_session');
}

// ============================================================================
// Admin Authentication
// ============================================================================

/**
 * Validate admin credentials
 */
export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  const admin = await prisma.adminUser.findUnique({
    where: { username },
  });

  if (!admin) {
    return { valid: false, error: 'Invalid credentials' };
  }

  const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatch) {
    return { valid: false, error: 'Invalid credentials' };
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return { valid: true };
}

/**
 * Create admin session token
 */
export async function createAdminSession(username: string): Promise<string> {
  const token = await new SignJWT({ username, type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verify admin session token
 */
export async function verifyAdminSession(
  token: string
): Promise<{ valid: boolean; username?: string }> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    const payload = verified.payload as { username: string; type: string };

    if (payload.type !== 'admin') {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Set admin session cookie
 */
export async function setAdminSessionCookie(username: string): Promise<void> {
  const token = await createAdminSession(username);
  const cookieStore = await cookies();

  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
}

/**
 * Get admin from session
 */
export async function getAdminFromSession(): Promise<{
  username: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session');

  if (!token) {
    return null;
  }

  const verified = await verifyAdminSession(token.value);
  if (!verified.valid || !verified.username) {
    return null;
  }

  return { username: verified.username };
}

/**
 * Clear admin session
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

/**
 * Require club authentication (middleware helper)
 */
export async function requireClubAuth(): Promise<Club> {
  const club = await getClubFromSession();
  if (!club) {
    throw new Error('Unauthorized - Club authentication required');
  }
  return club;
}

/**
 * Require admin authentication (middleware helper)
 */
export async function requireAdminAuth(): Promise<{ username: string }> {
  const admin = await getAdminFromSession();
  if (!admin) {
    throw new Error('Unauthorized - Admin authentication required');
  }
  return admin;
}

// ============================================================================
// Island Device Authentication
// ============================================================================

/**
 * Generate a device token for Island Device setup
 */
export async function generateDeviceToken(islandId: string): Promise<string> {
  const token = await new SignJWT({ islandId, type: 'device' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Short-lived for setup
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verify device token
 */
export async function verifyDeviceToken(
  token: string
): Promise<{ valid: boolean; islandId?: string }> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    const payload = verified.payload as { islandId: string; type: string };

    if (payload.type !== 'device') {
      return { valid: false };
    }

    return { valid: true, islandId: payload.islandId };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Validate cron secret for scheduled jobs
 */
export function validateCronSecret(providedSecret: string): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not set - cron endpoints are not protected');
    return true; // Allow in development
  }

  return providedSecret === cronSecret;
}

/**
 * Hash password for admin users
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Generate a random club secret
 */
export function generateClubSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}
