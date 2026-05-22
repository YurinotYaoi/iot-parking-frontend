"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "@/lib/configs/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      router.push("/dashboard");
    }
  });

  return () => unsub();
  }, []);  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

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
        onChange={(e) => setEmail(e.target.value)}
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
        onChange={(e) => setPassword(e.target.value)}
        className=".dark:text-zinc-50"
      />

      <button
        type="submit"
        className="w-full rounded-md bg-blue-500 py-2 px-4 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;