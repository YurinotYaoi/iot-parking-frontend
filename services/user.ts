import type { UserProfile } from "@/models/user"
import { auth } from "@/lib/configs/firebaseClient"

export async function getUser(uid: string): Promise<UserProfile> {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) throw new Error("Not logged in")

  const token = await firebaseUser.getIdToken()

  const res = await fetch(`/api/users/${uid}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || "Failed to fetch user")
  }

  const json = await res.json()
  return json.data
}