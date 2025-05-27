"use client";
import { loginSignInAction } from "@/app/(auth)/(actions)/loginSignIn";
import { SubmitButton } from "./SubmitButton";
import { useActionState, useEffect } from "react";
import { redirect } from "next/navigation";

function LoginSignInForm() {
  const [formState, action, pending] = useActionState(
    loginSignInAction,
    undefined
  );

  useEffect(() => {
    if (!formState) return;
    if (formState.success && formState.token) {
      localStorage.setItem("token", formState.token);
      redirect("/");
    }
  }, [formState]);
  return (
    <form action={action} className="flex flex-col gap-y-2">
      <span className="text-lg text-red-400">
        {formState?.success
          ? `${formState?.message || ""}`
          : `${formState?.message || ""}`}
      </span>
      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        type="text"
        minLength={3}
        required
        className="border-2 rounded-sm focus:outline-white focus:outline p-1.5 border-[#27272A]"
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        minLength={3}
        required
        className="border-2 rounded-sm focus:outline-white focus:outline p-1.5 border-[#27272A]"
      />
      <div className="flex w-full items-center justify-center space-x-4  py-2">
        <SubmitButton
          label="Login"
          loading={"Loading..."}
          pending={pending}
          mode="login"
        />
        <SubmitButton
          mode="signIn"
          label="Sign In"
          loading={"Loading..."}
          pending={pending}
        />
      </div>
    </form>
  );
}

export default LoginSignInForm;
