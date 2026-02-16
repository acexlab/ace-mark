'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🔐 Load profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setEmail(user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || null);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  // 📸 Upload avatar (FIXED)
  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) {
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        avatar_url: publicUrl,
      });

      setAvatarUrl(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  // 💾 Save profile
  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
    });

    alert('Profile updated');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A13] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-semibold">Profile</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-[#0E1222] p-6 rounded-xl space-y-6">
          {/* AVATAR */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center overflow-hidden text-2xl font-bold">
              {avatarUrl ? (
                <img
                  src={`${avatarUrl}?t=${Date.now()}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                email[0]?.toUpperCase()
              )}
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    uploadAvatar(e.target.files[0]);
                  }
                }}
              />
              <span className="bg-[#070A13] border border-white/10 px-4 py-2 rounded hover:bg-white/5">
                {uploading ? 'Uploading…' : 'Change photo'}
              </span>
            </label>
          </div>

          {/* EMAIL */}
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p>{email}</p>
          </div>

          {/* NAME */}
          <div>
            <label className="text-sm text-gray-400">Full Name</label>
            <input
              className="w-full mt-1 bg-[#070A13] border border-white/10 p-3 rounded"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <button
            onClick={saveProfile}
            className="bg-violet-600 px-6 py-2 rounded"
          >
            Save Profile
          </button>
        </div>
      </main>
    </div>
  );
}
