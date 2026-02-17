'use client';

import { useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Bookmark = {
  id: string;
  title: string;
  url: string;
  is_favorite: boolean;
  user_id: string;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  // 🔹 SORT: favorites first
  const sortBookmarks = (list: Bookmark[]) =>
    [...list].sort((a, b) =>
      a.is_favorite === b.is_favorite
        ? new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        : a.is_favorite
        ? -1
        : 1
    );

  // 🔐 AUTH + REALTIME (UNCHANGED LOGIC)
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id);

      if (data) setBookmarks(sortBookmarks(data));

      channel = supabase
        .channel('bookmarks-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setBookmarks((prev) => {
              let updated = [...prev];

              if (payload.eventType === 'INSERT') {
                updated.unshift(payload.new as Bookmark);
              }

              if (payload.eventType === 'UPDATE') {
                updated = updated.map((b) =>
                  b.id === payload.new.id ? payload.new as Bookmark : b
                );
              }

              if (payload.eventType === 'DELETE') {
                updated = updated.filter(
                  (b) => b.id !== payload.old.id
                );
              }

              return sortBookmarks(updated);
            });
          }
        )
        .subscribe();
    };

    init();
    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [router]);
  // ➕ ADD
  const addBookmark = async () => {
    if (!title || !url) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('bookmarks').insert({
      title,
      url,
      user_id: user.id,
      is_favorite: false,
    });

    setTitle('');
    setUrl('');
  };

  // ❤️ FAVORITE
  const toggleFavorite = async (b: Bookmark) => {
    await supabase
      .from('bookmarks')
      .update({ is_favorite: !b.is_favorite })
      .eq('id', b.id);
  };

  // ❌ DELETE
  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-[#070A13] text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0B1020] to-[#1A1F3C]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="px-4 py-4 md:px-6 md:py-5 border-b border-white/10">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex gap-6 items-center">
              <h1 className="font-semibold">Ace mark</h1>
              <button
                onClick={() => router.push('/profile')}
                className="text-gray-400 hover:text-white text-sm"
              >
                Profile
              </button>
            </div>
            <button
              onClick={logout}
              className="text-red-400 text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <section className="flex-1 px-4 py-8 md:px-6 md:py-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* ADD BAR */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 sm:py-2"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 sm:py-2"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                onClick={addBookmark}
                className="bg-violet-600 px-4 py-2 sm:px-6 rounded-lg font-medium"
              >
                Add
              </button>
            </div>

            {/* BOOKMARK LIST */}
            <div className="space-y-4">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 md:p-5 relative"
                >
                  {/* MENU */}
                  <button
                    onClick={() =>
                      setMenuOpenId(
                        menuOpenId === b.id ? null : b.id
                      )
                    }
                    className="absolute top-3 right-3 text-gray-400"
                  >
                    ⋮
                  </button>

                  {menuOpenId === b.id && (
                    <div className="absolute top-10 right-4 bg-[#070A13] border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          setEditingId(b.id);
                          setEditTitle(b.title);
                          setEditUrl(b.url);
                          setMenuOpenId(null);
                        }}
                        className="block px-4 py-2 hover:bg-white/5 w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleFavorite(b)}
                        className="block px-4 py-2 hover:bg-white/5 w-full text-left"
                      >
                        {b.is_favorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                      <button
                        onClick={() => deleteBookmark(b.id)}
                        className="block px-4 py-2 text-red-400 hover:bg-white/5 w-full text-left"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {editingId === b.id ? (
                    <div className="space-y-3">
                      <input
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <input
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            if (!editTitle || !editUrl) return;
                            await supabase
                              .from('bookmarks')
                              .update({ title: editTitle, url: editUrl })
                              .eq('id', b.id);
                            setEditingId(null);
                            // Optimistic update
                            setBookmarks((prev) =>
                              prev.map((p) =>
                                p.id === b.id ? { ...p, title: editTitle, url: editUrl } : p
                              )
                            );
                          }}
                          className="bg-violet-600 px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded bg-white/5 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{b.title}</h3>
                        <a
                          href={b.url}
                          target="_blank"
                          className="text-sm text-violet-400"
                        >
                          {b.url}
                        </a>
                      </div>

                      {b.is_favorite && (
                        <span className="text-red-500 text-xl">
                          ❤️
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center text-gray-500 text-sm py-6">
          
        </footer>
      </div>
    </main>
  );
}
