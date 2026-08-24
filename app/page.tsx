import type { Metadata } from "next"; 
import Link from "next/link";

export const metadata: Metadata = {
  title: "ADPark - Home",
};
export default function Home() {

  return (
    <div className="flex items-center justify-center">
      <main className="flex w-full max-w-6xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <div>
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to your{" "}
            <span className="text-red-700">IoT</span> frontend
          </h1>
          <p>
           The brain of your smart parking lot. Track, manage, and scale your IoT infrastructure with ADPark's intuitive real-time interface.
          </p>
          <div className="mt-4">
            <Link
              href="/auth/login"
              className="inline-block rounded-lg px-4 py-2 font-medium dark:text-black dark:bg-white bg-gray-800 text-white mr-4
              hover:bg-gray-500 hover:text-white
              transition duration-300 ease-in-out">
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="inline-block rounded-lg px-4 py-2 font-medium dark:text-black dark:bg-white bg-gray-800 text-white
              hover:bg-gray-500 hover:text-white
              transition duration-300 ease-in-out">
              Signup
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
