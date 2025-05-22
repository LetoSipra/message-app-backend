"use client";

import { z } from "zod";
import { loginSignInSchema } from "../(schemas)/loginSignInSchema";

type LoginSignIn = z.infer<typeof loginSignInSchema>;

type SubmitButtonProps = {
  label: string;
  loading: React.ReactNode;
  pending: boolean;
  mode: LoginSignIn["mode"];
};

export const SubmitButton = ({
  label,
  loading,
  pending,
  mode,
}: SubmitButtonProps) => {
  return (
    <button
      name="mode"
      value={mode}
      disabled={pending}
      className="flex mt-2 cursor-pointer w-full justify-center space-x-2 rounded-md  bg-[#fafafa] text-[#0a0a0b] py-2 transition-opacity duration-200 hover:opacity-75"
      type="submit"
    >
      <p className=""> {pending ? loading : label}</p>
    </button>
  );
};
