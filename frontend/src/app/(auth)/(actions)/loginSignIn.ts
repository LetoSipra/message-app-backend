"use server";
import { print } from "graphql";
import { UserSchema } from "@/graphql/operations/user";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSignInSchema } from "../(schemas)/loginSignInSchema";

type AuthResults =
  | { success: true; message: string }
  | { success: false; message: string };

export async function loginSignInAction(
  _prev: AuthResults | undefined,
  formData: FormData
): Promise<AuthResults> {
  const cookieStore = await cookies();
  const parsed = loginSignInSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) {
    return { success: false, message: "Username/password invalid format." };
  }
  const { username, password, mode } = parsed.data;

  const mutationDocument =
    mode === "signIn"
      ? UserSchema.Mutations.signIn
      : UserSchema.Mutations.login;

  const query = print(mutationDocument);
  const body = JSON.stringify({ query, variables: { username, password } });

  let upstream;
  try {
    upstream = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || "", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body,
    });
  } catch {
    return { success: false, message: "Server error" };
  }

  const payload = await upstream.json();

  if (!upstream.ok || payload.errors) {
    const message = payload.errors?.[0]?.message || "Invalid credentials";
    return { success: false, message: message };
  }
  if (mode === "signIn") {
    return { success: true, message: "Successfully logged in" };
  } else {
    const setCookieHeader = upstream.headers.get("set-cookie");
    if (setCookieHeader) {
      cookieStore.set({
        name: "token",
        value: (setCookieHeader.match(/token=([^;]+)/) || [])[1] || "",
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    redirect("/");
  }
}
