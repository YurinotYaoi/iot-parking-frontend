"use client";

import ThemeToggle from "@/components/ui/theme-toggle";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/services/logout";

const Navbar = () => {

  const router = useRouter();

  const handleHomeClick = async () => {
  await logoutUser();
  router.push("/");
  };

  return (
    <nav className="w-full bg-gray-900 py-5 px-24 border-b border-gray-700">
      <ul className="flex items-center justify-between">
        <li className="flex items-center">
          <button onClick={handleHomeClick} className="text-2xl font-bold text-white cursor-hover:text-gray-300">
            FlexPark
          </button>
        </li>
        <li className="flex items-center">
          <ThemeToggle />
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;