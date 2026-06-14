import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

const githubClientId =
  process.env.AUTH_GITHUB_ID ??
  process.env.GITHUB_ID ??
  process.env.GITHUB_CLIENT_ID
const githubClientSecret =
  process.env.AUTH_GITHUB_SECRET ??
  process.env.GITHUB_SECRET ??
  process.env.GITHUB_CLIENT_SECRET
export const isGitHubConfigured = Boolean(githubClientId && githubClientSecret)

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers:
    isGitHubConfigured
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
            authorization: { params: { scope: "repo read:user" } },
          }),
        ]
      : [],
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
