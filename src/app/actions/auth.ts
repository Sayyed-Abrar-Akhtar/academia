"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser as getCurrentUserFromLib } from "@/lib/auth";

export async function getCurrentUser() {
  return await getCurrentUserFromLib();
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/");
}
