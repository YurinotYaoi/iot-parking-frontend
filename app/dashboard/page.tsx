"use client";

import { Button } from "@/components/ui/button";
import { signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/configs/firebaseClient";
import { useRouter } from "next/navigation";
import { IoLogOutOutline, IoSettings } from "react-icons/io5";
import { FaMapLocationDot, FaTableList } from "react-icons/fa6";
import { getUser } from "@/services/user";
import { useEffect, useState } from "react";
import type { UserProfile } from "@/models/user";
import SensorList from "@/components/SensorList";
import CreateSensorModal from "@/components/modals/CreateSensorModal";
import LocationModal from "@/components/modals/LocationModal";
import { Skeleton } from "@/components/Skeleton";
import { Spinner } from "@/components/Spinner";

export default function DashboardScreen() {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true); // 1. loading state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showCSModal, setShowCSModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // ── Auth + user fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setIsUserLoading(false);
        return;
      }
      try {
        const data = await getUser(firebaseUser.uid);
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setIsUserLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  const openCSModal = () => setShowCSModal(true);
  const closeCSModal = () => setShowCSModal(false);
  const openLocationModal = () => setShowLocationModal(true);
  const closeLocationModal = () => setShowLocationModal(false);

  const handleSaveLocation = async (name: string, link: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await fetch("/api/users/location", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, link }),
      });
      if (auth.currentUser) {
        const data = await getUser(auth.currentUser.uid);
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to save location:", err);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="flex flex-col w-full items-center justify-center">
      <div className="w-screen max-w-600 flex flex-rows h-213">

        {/* Modals */}
        {showCSModal && <CreateSensorModal onClose={closeCSModal} />}
        {showLocationModal && (
          <LocationModal
            onClose={closeLocationModal}
            onSave={handleSaveLocation}
            initialName={user?.location?.name || ""}
            initialLink={user?.location?.link || ""}
          />
        )}

        {/* LEFT PANEL */}
        <div className="w-[30%] p-2">
          <div className="h-full w-full border-2 border-gray-800 rounded-md p-1">
            <div className="p-10">
              {isUserLoading ? (
                // Skeleton placeholder for the user name
                <div className="flex justify-center" aria-busy="true" aria-live="polite">
                  <span className="sr-only">Loading user…</span>
                  <Skeleton className="h-9 w-48" />
                </div>
              ) : user ? (
                <h1 className="text-center text-3xl">
                  {user.firstName} {user.lastName}
                </h1>
              ) : (
                <h1 className="text-center text-3xl text-zinc-500">No user</h1>
              )}
            </div>

            <div className="text-2xl">
              <Button
                className="shadow-md active:shadow-inner active:translate-y-px w-full rounded-sm justify-start bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800"
                onClick={openLocationModal}
                disabled={isUserLoading}
              >
                <FaMapLocationDot className="!size-5" /> | {user?.location?.name || "Location"}
              </Button>

              {isUserLoading ? (
                <div className="mt-4">
                  <Skeleton className="h-[600px] w-full rounded-md" />
                </div>
              ) : (
                user?.location?.link && (
                  <div className="mt-4">
                    <iframe
                      src={user.location.link}
                      width="100%"
                      height="600"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-md"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[70%] p-2 flex flex-col">
          <div className="h-fit w-full flex border-2 border-gray-800 rounded-md p-1 mb-1 justify-between">
            <div>
              <Button
                className="shadow-md active:shadow-inner active:translate-y-px rounded-sm mr-1 bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800"
                onClick={openCSModal}
              >
                Create Sensor +
              </Button>

              <Button
                className="shadow-md active:shadow-inner active:translate-y-px rounded-sm bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800"
                onClick={() => router.push("/dashboard/layout")}
              >
                Layouts
                <FaTableList />
              </Button>
            </div>

            <div>
              <Button
                className="shadow-md active:shadow-inner active:translate-y-px rounded-sm mr-1 bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800"
                onClick={() => router.push("/dashboard/settings")}
              >
                <IoSettings />
                Settings
              </Button>

              <Button
                className="shadow-md active:shadow-inner active:translate-y-px rounded-sm bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <Spinner size="sm" label="Logging out" />
                    Logging out…
                  </>
                ) : (
                  <>
                    <IoLogOutOutline />
                    Logout
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grow w-full border-2 border-gray-800 rounded-md">
            <SensorList />
          </div>
        </div>
      </div>
    </main>
  );
}