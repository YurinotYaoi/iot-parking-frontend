
import LoginForm from "@/auth/components/LoginForm";
import type { Metadata } from "next"; 

export const metadata: Metadata = {
  title: "Login | FlexPark",
};

export default function LoginScreen() {

  return (
    <main className="flex flex-col w-full items-center justify-center py-32 px-16">
      <div className="p-5 rounded-2xl
      flex flex-col items-center justify-center">
        <h1 className="text-3xl font-semibold
        text-black dark:text-zinc-50">
          Login Page
        </h1>
        <p className="py-4">
          Don't have an account? <a href="/auth/signup"><u>Signup</u></a>
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
