import { cookies } from "next/headers";
import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, sessionToken),
    });

    return user || null;
  } catch (error) {
    return null;
  }
}
