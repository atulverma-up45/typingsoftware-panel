import { createAuthClient } from "better-auth/react";
import { env } from "@/config/env";

export const authClient = createAuthClient({
  baseURL: env.AUTH_URL,
});

export const { signIn, signOut, useSession, getSession } = authClient;
