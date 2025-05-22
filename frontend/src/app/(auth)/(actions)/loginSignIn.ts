"use server";
import { print } from "graphql";
import { UserSchema } from "@/graphql/operations/user";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSignInSchema } from "../(schemas)/loginSignInSchema";

// a simple Zod schema to validate username/password

// We’ll return either { success: true } or { success: false, error: string }.
// That way, the client can check the `error` field instead of catching a thrown exception.
type AuthResults =
  | { success: true; message: string }
  | { success: false; message: string };

export async function loginSignInAction(
  _prev: AuthResults | undefined, // hook’s “initial state” placeholder; unused
  formData: FormData
): Promise<AuthResults> {
  const cookieStore = await cookies();
  // 1) Extract & validate the form inputs
  const parsed = loginSignInSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) {
    // If Zod validation fails, send back a user‑friendly message:
    return { success: false, message: "Username/password invalid format." };
  }
  const { username, password, mode } = parsed.data;

  // 2) Run your GraphQL login mutation
  const mutationDocument =
    mode === "signIn"
      ? UserSchema.Mutations.signIn
      : UserSchema.Mutations.login;

  const query = print(mutationDocument);
  const body = JSON.stringify({ query, variables: { username, password } });

  // 3) Parse the JSON payload & check for errors
  let upstream;
  try {
    upstream = await fetch("http://localhost:4000/graphql", {
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
    // If GraphQL returned `errors: [...]`, grab the first message
    const message = payload.errors?.[0]?.message || "Invalid credentials";
    return { success: false, message: message };
  }
  // 4) On success, set the HTTP‑only cookie
  if (mode === "signIn") {
    // (optionally set a cookie or do nothing)
    return { success: true, message: "Successfully logged in" };
  } else {
    const setCookieHeader = upstream.headers.get("set-cookie");
    // on successful login, set the cookie then redirect to homepage
    if (setCookieHeader) {
      cookieStore.set({
        name: "token",
        value: (setCookieHeader.match(/token=([^;]+)/) || [])[1] || "",
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        secure: process.env.NODE_ENV === "production",
      });
    }

    // 5) Redirect to “/” now that the login succeeded
    redirect("/");
  }
}
