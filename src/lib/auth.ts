import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

// Create PrismaClient directly in this file to avoid Turbopack
// module resolution issues with the shared @/lib/db instance.
const db = new PrismaClient();

/**
 * NextAuth configuration.
 *
 * Providers:
 * 1. Google OAuth — activated when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
 *    are set in .env (production auth, matches original CrossCrafted repo).
 * 2. Credentials — dev-only, for local testing without Google OAuth setup.
 *    Lets you create a test user by entering any email + name.
 *
 * Both providers use the SAME User model, SAME session, SAME trivia data.
 * There is no duplicate auth system.
 */

const isProduction = process.env.NODE_ENV === "production";
const hasGoogleCreds = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET
);

const providers: any[] = [];

if (hasGoogleCreds) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

// Dev-only credentials provider — DISABLED in production by default.
// In production, only Google OAuth is available.
// To enable dev login on a staging/Vercel deployment for testing, set:
//   NEXT_PUBLIC_ALLOW_DEV_LOGIN=true
// in the Vercel env vars. This is opt-in and off by default for security.
const allowDevLoginInProd = process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true";
if (!isProduction || allowDevLoginInProd) {
  providers.push(
    CredentialsProvider({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@crosscrafted.app" },
        name: { label: "Name", type: "text", placeholder: "Test Player" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.trim().toLowerCase();
        const name = credentials.name?.trim() || email.split("@")[0];

        // Bootstrap admin: if BOOTSTRAP_ADMIN_EMAIL env var matches the
        // logging-in email, auto-promote them to admin role. This lets you
        // set up the first admin on a fresh Vercel deployment without DB
        // access. The env var can be removed/changed after the first admin
        // exists. Multiple emails can be comma-separated.
        const bootstrapEmails = (process.env.BOOTSTRAP_ADMIN_EMAIL || "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const shouldBeAdmin = bootstrapEmails.includes(email);

        // Find or create user
        let user = await db.user.findUnique({ where: { email } });
        if (!user) {
          user = await db.user.create({
            data: {
              email,
              name,
              role: shouldBeAdmin ? "admin" : "user",
              totalPoints: 0,
            },
          });
          console.log(`[auth] Created new dev user: ${email} (role: ${user.role})`);
        } else if (shouldBeAdmin && user.role !== "admin") {
          // Existing user — promote to admin if bootstrap email matches
          user = await db.user.update({
            where: { id: user.id },
            data: { role: "admin" },
          });
          console.log(`[auth] Promoted ${email} to admin (bootstrap)`);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  // Note: No adapter when using Credentials + JWT. The Credentials provider
  // creates users directly in the authorize() callback via db.user.create().
  // Google OAuth (when configured) will also work without an adapter in JWT mode
  // — we create/link the user in the signIn callback.
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth: create or find user in DB
      if (account?.provider === "google" && user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email },
        });
        if (!existing) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              image: user.image || null,
              role: "user",
              totalPoints: 0,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { id: true, totalPoints: true, role: true, name: true, image: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.totalPoints = dbUser.totalPoints;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
        session.user.totalPoints = token.totalPoints as number;
        session.user.role = token.role as string;

        // Fetch fresh totalPoints from DB (in case it changed since JWT was issued)
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { totalPoints: true },
        });
        if (dbUser) {
          session.user.totalPoints = dbUser.totalPoints;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend the session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      totalPoints: number;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    totalPoints: number;
    role: string;
  }
}
