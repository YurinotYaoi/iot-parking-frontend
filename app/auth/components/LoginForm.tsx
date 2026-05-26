"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/configs/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      router.push("/dashboard");
    }
  });

  return () => unsub();
  }, []);  

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const token = await cred.user.getIdToken();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // Note: data.data contains the actual user info because successResponse wraps it
      localStorage.setItem('flexpark_auth', JSON.stringify({ token, user: { ...data.data, password } }));
      
      router.push("/dashboard");
    } catch (err: unknown) {
      console.log("LOGIN ERROR:", err);

      // Safe error handling
      if (err instanceof Error) {
        alert(err.message);
      } else if (typeof err === "object" && err !== null && "code" in err) {
        const firebaseErr = err as { code?: string; message?: string };
        alert(firebaseErr.code || firebaseErr.message || "Login failed");
      } else {
        alert("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col" onSubmit={handleLogin}>
      <label htmlFor="email" className="text-sm font-medium 
      .dark:text-zinc-50">
        Email
      </label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className=".dark:text-zinc-50"
      />

      <label htmlFor="password" className="text-sm font-medium
      .dark:text-zinc-50">
        Password
      </label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className=".dark:text-zinc-50"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-500 py-2 px-4 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4 disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size="sm" label="Logging in" />
            Logging in…
          </span>
        ) : "Login"}
      </button>
    </form>
  );
};

export default LoginForm;