import { signIn, signOut, getSession } from "@/lib/auth-client";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data, error } = await signIn.email({
      email: credentials.email,
      password: credentials.password || "",
    });

    if (error) {
      throw new Error(error.message || "Login failed");
    }

    return data;
  },

  logout: async () => {
    await signOut();
  },

  getProfile: async () => {
    const { data, error } = await getSession();

    if (error || !data?.user) {
      throw new Error(error?.message || "Not authenticated");
    }

    return data.user;
  },
};
