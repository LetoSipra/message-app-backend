"use client";

import { createContext, useContext, ReactNode } from "react";

export interface CurrentUser {
  id: string;
  username: string;
}

interface UserContextType {
  user: CurrentUser | null;
}

const UserContext = createContext<UserContextType>({ user: null });

export function UserProvider({
  user,
  children,
}: {
  user: CurrentUser | null;
  children: ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
