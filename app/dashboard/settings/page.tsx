"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SettingsPage() {

    useEffect(() => {
    document.title = "Settings";
  }, []);

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({ firstName: '', lastName: '', middleName: '', email: '', password: '' });

  useEffect(() => {
    // First, try to get user data from localStorage and set it immediately
    const authData = JSON.parse(localStorage.getItem('flexpark_auth') || '{}');
    if (authData.user) {
      setUser({
        firstName: authData.user.firstName || '',
        lastName: authData.user.lastName || '',
        middleName: authData.user.middleName || '',
        email: authData.user.email || '',
        password: authData.user.password || ''
      });
    }

    // Then fetch fresh data from API
    const fetchUser = async () => {
      try {
        const token = authData.token;
        
        console.log('Auth data:', authData);
        console.log('Token exists:', !!token);

        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await response.json();
        console.log('API response status:', response.status);
        console.log('User data from API:', result);
        
        if (response.ok && result.success) {
          const data = result.data;
          setUser(prev => ({ 
            firstName: data.firstName || prev.firstName, 
            lastName: data.lastName || prev.lastName, 
            middleName: data.middleName || prev.middleName, 
            email: data.email || prev.email, 
            password: prev.password // Keep existing password
          }));
        } else if (response.status === 401) {
          console.error('Unauthorized - redirecting to login');
          router.push('/auth/login');
        } else {
          console.error('Error fetching user:', result.error);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const authData = JSON.parse(localStorage.getItem('flexpark_auth') || '{}');
    const token = authData.token;
    const uid = authData.user?.uid;

    if (!uid) {
      toast.error('User ID not found');
      setIsLoading(false);
      return;
    }

    const response = await fetch(`/api/users/${uid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        email: user.email,
        password: user.password,
      }),
    });
    const data = await response.json();
    if (response.ok && data.success) {
      // Update localStorage with new user data including password
      localStorage.setItem('flexpark_auth', JSON.stringify({ token, user: { ...data.data, password: user.password } }));
      toast.success('Profile updated successfully');
      router.push('/dashboard');
    } else {
      toast.error(data.error || 'Failed to update profile');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">      
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={user.firstName || "First Name"}
              value={user.firstName}
              onChange={(e) => setUser({ ...user, firstName: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              id="middleName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={user.middleName || "Middle Name"}
              value={user.middleName}
              onChange={(e) => setUser({ ...user, middleName: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={user.lastName || "Last Name"}
              value={user.lastName}
              onChange={(e) => setUser({ ...user, lastName: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={user.email || "Email"}
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={user.password || "Password"}
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save
            </button>
            <button
              type="button"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-white py-2 px-4 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 