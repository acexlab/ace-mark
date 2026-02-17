'use client';

import { supabase } from '@/lib/supabaseClient';

export default function LandingPage() {
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#070A13] text-white relative overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0B1020] to-[#1A1F3C] opacity-90" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto w-full">
          <h1 className="text-lg font-semibold tracking-wide">
            Ace mark
          </h1>
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center text-center px-4 md:px-6 flex-1 justify-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6">
            Ace mark
          </h2>

          <p className="text-gray-400 max-w-xl text-sm sm:text-base md:text-lg mb-6 md:mb-10">
            Save, organize, and access your important links — securely
            synced across all devices.
          </p>

          <button
            onClick={loginWithGoogle}
            className="bg-white text-black px-6 py-2 md:px-8 md:py-3 rounded-full font-medium hover:bg-gray-200 transition"
          >
            Continue with Google
          </button>
        </section>

        {/* Features */}
        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Card */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                🔐 Secure
              </h3>
              <p className="text-gray-400 text-sm">
                Google authentication with private, user-only data
                access.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                ⚡ Real-time
              </h3>
              <p className="text-gray-400 text-sm">
                Changes sync instantly across tabs and devices.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                📚 Organized
              </h3>
              <p className="text-gray-400 text-sm">
                Save and manage all your important links in one
                place.
              </p>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-10">
            
          </p>
        </section>
      </div>
    </main>
  );
}
