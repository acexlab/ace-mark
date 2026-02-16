'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // 🔹 SORT: favorites first, then newest
  const sortBookmarks = (list: Bookmark[]) =>
    [...list].sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) {
        return a.is_favorite ? -1 : 1;
      }
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

  // 🔐 AUTH + REALTIME
  useEffect(() => {
    let channel: any;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      // Initial fetch
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id);

      if (data) setBookmarks(sortBookmarks(data));
      setLoading(false);

      // 🔥 REALTIME
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
                updated.push(payload.new as Bookmark);
              }

              if (payload.eventType === 'UPDATE') {
                updated = updated.map((b) =>
                  b.id === payload.new.id
                    ? (payload.new as Bookmark)
                    : b
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
      if (channel) supabase.removeChannel(channel);
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

  // ✏️ UPDATE
  const updateBookmark = async () => {
    if (!editing) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('bookmarks')
      .update({
        title: editing.title,
        url: editing.url,
      })
      .eq('id', editing.id)
      .eq('user_id', user.id);

    setEditing(null);
  };

  // ❌ DELETE
  const deleteBookmark = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
  };

  // ❤️ FAVORITE TOGGLE
  const toggleFavorite = async (b: Bookmark) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('bookmarks')
      .update({ is_favorite: !b.is_favorite })
      .eq('id', b.id)
      .eq('user_id', user.id);
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <h1 className="font-semibold">Ace mark</h1>
            <Link
              href="/profile"
              className="text-sm text-gray-400 hover:text-white"
            >
              Profile
            </Link>
          </div>

          <button onClick={logout} className="text-red-400 text-sm">
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* ADD */}
        <div className="bg-[#0E1222] p-6 rounded-xl mb-8">
          <div className="flex gap-4">
            <input
              className="flex-1 bg-[#070A13] border border-white/10 p-3 rounded"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="flex-1 bg-[#070A13] border border-white/10 p-3 rounded"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={addBookmark}
              className="bg-violet-600 px-5 rounded"
            >
              Add
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="bg-[#0E1222] p-5 rounded-xl border border-white/10 relative"
            >
              {/* MENU */}
              <button
                onClick={() =>
                  setMenuOpenId(menuOpenId === b.id ? null : b.id)
                }
                className="absolute top-3 right-3 text-gray-400"
              >
                ⋮
              </button>

              {menuOpenId === b.id && (
                <div className="absolute top-8 right-3 bg-[#070A13] border border-white/10 rounded-lg z-10">
                  <button
                    onClick={() => {
                      setEditing(b);
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

              {/* TITLE + HEART */}
              <div className="flex justify-between items-start">
                <h3 className="font-medium mb-1">{b.title}</h3>
                {b.is_favorite && (
                  <span className="text-red-500 text-xl">❤️</span>
                )}
              </div>

              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-violet-400 break-all"
              >
                {b.url}
              </a>
            </div>
          ))}
        </div>
      </main>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#0E1222] p-6 rounded-xl w-full max-w-md">
            <h2 className="font-semibold mb-4">Edit Bookmark</h2>

            <input
              className="w-full mb-3 bg-[#070A13] border border-white/10 p-3 rounded"
              value={editing.title}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
            />

            <input
              className="w-full mb-4 bg-[#070A13] border border-white/10 p-3 rounded"
              value={editing.url}
              onChange={(e) =>
                setEditing({ ...editing, url: e.target.value })
              }
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={updateBookmark}
                className="bg-violet-600 px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
