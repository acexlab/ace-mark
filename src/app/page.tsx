  'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LandingPage() {
  const router = useRouter();

  // 🔐 Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push('/dashboard');
      }
    };

    checkSession();
  }, [router]);

  // 🔑 Google login
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/dashboard',
      },
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* HERO */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Ace mark
        </h1>

        <p className="text-gray-400 max-w-xl mb-8">
          Save, organize, and access your important links securely.
          Your bookmarks, synced in real time across devices.
        </p>

        <button
          onClick={loginWithGoogle}
          className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          Continue with Google
        </button>
      </section>

      {/* FEATURES */}
      <section className="bg-gray-900 py-12 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">🔐 Secure</h3>
            <p className="text-gray-400">
              Google authentication with private, user-only data access.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">⚡ Real-time</h3>
            <p className="text-gray-400">
              Changes sync instantly across tabs and devices.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">📚 Organized</h3>
            <p className="text-gray-400">
              Save and manage all your important links in one place.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-gray-500 text-sm py-4">
        Built with Next.js & Supabase
      </footer>
    </main>
  );
}
