import { signOut } from "firebase/auth";
import { auth } from "@/lib/configs/firebaseClient";

export const logoutUser = async () => {
  await signOut(auth);
};