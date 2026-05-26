// components/SignupForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/configs/firebaseClient";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";


const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !firstName || !lastName || !password || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          middleName,
          lastName,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error("This email is already registered. Please log in instead.");
        setLoading(false);
        return;
      }

      if (res.status < 200 || res.status >= 300) {
        toast.error(data.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      localStorage.setItem("authToken", token);
      localStorage.setItem("userId", userCredential.user.uid);


      toast.success("Account created successfully! Redirecting...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      if (error instanceof Error && "code" in error) {
        const firebaseErr = error as { code?: string };
        switch (firebaseErr.code) {
          case "auth/email-already-in-use":
            toast.error("This email is already in use.");
            break;
          case "auth/invalid-email":
            toast.error("Invalid email address.");
            break;
          case "auth/weak-password":
            toast.error("Password is too weak. Use at least 6 characters.");
            break;
          case "auth/network-request-failed":
            toast.error("Network error. Please check your connection.");
            break;
          default:
            toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }

      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col">
      <label htmlFor="email">Email</label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={loading}
      />

      <label htmlFor="firstName">First Name</label>
      <input
        type="text"
        id="firstName"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        disabled={loading}
      />

      <label htmlFor="middleName">Middle Name</label>
      <input
        type="text"
        id="middleName"
        value={middleName}
        onChange={(event) => setMiddleName(event.target.value)}
        disabled={loading}
      />

      <label htmlFor="lastName">Last Name</label>
      <input
        type="text"
        id="lastName"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
        disabled={loading}
      />

      <label htmlFor="password">Password</label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={loading}
      />

      <label htmlFor="confirmPassword">Confirm Password</label>
      <input
        type="password"
        id="confirmPassword"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        disabled={loading}
      />

      <button
        type="button"
        className="w-full rounded-md bg-blue-500 py-2 px-4 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4 disabled:opacity-50"
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size="sm" label="Signing up" />
            Signing up…
          </span>
        ) : "Sign Up"}
      </button>
    </form>
  );
};

export default SignUpForm;
