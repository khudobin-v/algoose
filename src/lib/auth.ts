import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Логин', type: 'text' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null

        const username = process.env.AUTH_USERNAME
        const email = process.env.AUTH_EMAIL
        const hash = process.env.AUTH_PASSWORD_HASH

        if (!username || !hash) return null

        const loginMatch =
          credentials.login === username || credentials.login === email

        if (!loginMatch) return null

        const valid = await bcrypt.compare(credentials.password, hash)
        if (!valid) return null

        return { id: username, name: username, email: email ?? '' }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    session({ session, token }) {
      if (token.userId && session.user) session.user.id = token.userId as string
      return session
    },
  },
}
