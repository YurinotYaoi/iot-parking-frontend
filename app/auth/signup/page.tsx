import SignUpForm from "@/auth/components/SignUpForm";
import type { Metadata } from "next"; 

export const metadata: Metadata = {
  title: "Signup | FlexPark",
};
export default function SignupScreen() {

  return (
    <main className="flex flex-col w-full items-center justify-center py-32 px-16">
      <div className="p-5 rounded-2xl
      flex flex-col items-center justify-center">
        <h1 className="text-3xl font-semibold
        text-black dark:text-zinc-50">
          Signup Page
        </h1>
        <p className="py-4">
          Already have an account? <a href="/auth/login"><u>Login</u></a>
        </p>
        <SignUpForm />
        </div>
    </main>
  );
}
