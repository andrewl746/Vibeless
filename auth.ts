import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: "repo read:user" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        // profile is the raw GitHub /user response
        token.login = (profile as { login?: string })?.login
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.login = token.login as string
      return session
    },
  },
})
