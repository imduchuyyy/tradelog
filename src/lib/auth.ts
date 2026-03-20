import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // For new users, set trial end date to 3 days from now
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existingUser) {
          // User will be created by the adapter, we update after
          setTimeout(async () => {
            try {
              await prisma.user.update({
                where: { email: user.email! },
                data: {
                  trialEndsAt: new Date(
                    Date.now() + 3 * 24 * 60 * 60 * 1000
                  ),
                  plan: "trial",
                },
              });
            } catch {
              // User might not be created yet
            }
          }, 1000);
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Set trial for newly created users
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            plan: "trial",
          },
        });
      }
    },
  },
});
