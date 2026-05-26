import { db } from "./configs/firebaseClient";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const saveLayout = async (layoutId: string, grid: any) => {
  await setDoc(doc(db, "layouts", layoutId), {
    grid,
    createdAt: new Date(),
  });
};

export const loadLayout = async (layoutId: string) => {
  const ref = doc(db, "layouts", layoutId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data().grid;
};