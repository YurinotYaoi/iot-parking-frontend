// components/SignupForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/configs/firebaseClient";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";

type FormErrors = {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();

  const clearFieldError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleRegister = async () => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Enter a valid email address";
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, middleName, lastName }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setErrors({ email: "This email is already registered. Please log in instead." });
        setLoading(false);
        return;
      }

      if (res.status < 200 || res.status >= 300) {
        setErrors({ form: data.message || "Registration failed. Please try again." });
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
            setErrors({ email: "This email is already in use." });
            break;
          case "auth/weak-password":
            setErrors({ password: "Password is too weak. Use at least 6 characters." });
            break;
          case "auth/network-request-failed":
            setErrors({ form: "Network error. Please check your connection." });
            break;
          default:
            setErrors({
              form:
                error instanceof Error
                  ? error.message
                  : "Something went wrong. Please try again.",
            });
        }
      } else {
        setErrors({ form: "An unexpected error occurred. Please try again." });
      }

      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-3">
      {errors.form && (
        <p className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span aria-hidden="true">⚠</span> {errors.form}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
          disabled={loading}
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
        <label htmlFor="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value);
            clearFieldError("firstName");
          }}
          disabled={loading}
          aria-invalid={!!errors.firstName}
          className={errors.firstName ? "border-destructive" : ""}
        />
        {errors.firstName && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <span aria-hidden="true">⚠</span> {errors.firstName}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="middleName">Middle Name</label>
        <input
          type="text"
          id="middleName"
          value={middleName}
          onChange={(event) => setMiddleName(event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(event) => {
            setLastName(event.target.value);
            clearFieldError("lastName");
          }}
          disabled={loading}
          aria-invalid={!!errors.lastName}
          className={errors.lastName ? "border-destructive" : ""}
        />
        {errors.lastName && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <span aria-hidden="true">⚠</span> {errors.lastName}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError("password");
          }}
          disabled={loading}
          aria-invalid={!!errors.password}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <span aria-hidden="true">⚠</span> {errors.password}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            clearFieldError("confirmPassword");
          }}
          disabled={loading}
          aria-invalid={!!errors.confirmPassword}
          className={errors.confirmPassword ? "border-destructive" : ""}
        />
        {errors.confirmPassword && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <span aria-hidden="true">⚠</span> {errors.confirmPassword}
          </p>
        )}
      </div>

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
        ) : (
          "Sign Up"
        )}
      </button>
    </form>
  );
};

export default SignUpForm;
