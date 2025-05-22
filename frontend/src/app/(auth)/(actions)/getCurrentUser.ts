import { query } from "@/graphql/apollo-client";
import { UserSchema } from "@/graphql/operations/user";
import { GetCurrentUser, SearchedUser } from "@/typings";

export async function getCurrentUser(): Promise<SearchedUser | null> {
  try {
    const currentUser = await query<GetCurrentUser>({
      query: UserSchema.Queries.getCurrentUser,
    });
    const { getCurrentUser } = currentUser.data;
    return getCurrentUser;
  } catch (err) {
    console.error("Error getting current user:", err);
    return null;
  }
}
