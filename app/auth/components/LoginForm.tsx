"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/configs/firebaseClient";
import { Spinner } from "@/components/Spinner";

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();

  const clearFieldError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

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

    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Enter a valid email address";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

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
        setErrors({ form: data.error || "Login failed" });
        return;
      }

      localStorage.setItem(
        "flexpark_auth",
        JSON.stringify({ token, user: { ...data.data, password } })
      );
      router.push("/dashboard");
    } catch (err: unknown) {
      console.log("LOGIN ERROR:", err);

      if (typeof err === "object" && err !== null && "code" in err) {
        const firebaseErr = err as { code?: string };
        switch (firebaseErr.code) {
          case "auth/invalid-credential":
          case "auth/invalid-email":
            setErrors({ email: "Invalid email or password" });
            break;
          case "auth/user-disabled":
            setErrors({ form: "This account has been disabled. Contact support." });
            break;
          case "auth/too-many-requests":
            setErrors({ form: "Too many failed attempts. Please try again later." });
            break;
          default:
            setErrors({
              form: err instanceof Error ? err.message : "Login failed",
            });
        }
      } else {
        setErrors({ form: "Login failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleLogin}>
      {errors.form && (
        <p className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span aria-hidden="true">⚠</span> {errors.form}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium dark:text-zinc-50">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
          aria-invalid={!!errors.email}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <span aria-hidden="true">⚠</span> {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium dark:text-zinc-50">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError("password");
          }}
          aria-invalid={!!errors.password}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <span aria-hidden="true">⚠</span> {errors.password}
          </p>
        )}
      </div>

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
        ) : (
          "Login"
        )}
      </button>
    </form>
  );
};

export default LoginForm;
