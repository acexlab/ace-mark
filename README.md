# Ace Mark

Ace Mark is a realtime bookmark management application built using Next.js (App Router) and Supabase. This project was developed as part of an interview and evaluation process, with the main intention of demonstrating how I approach unfamiliar technologies, handle mistakes, and progressively build understanding through debugging and experimentation.

Rather than presenting a perfectly smooth development story, this README documents the actual problems I faced, the gaps in my knowledge at the start, and how I worked through them step by step. The focus of this project is not only the final result, but the learning and reasoning process behind it.

---

## Tech Stack

The frontend of the application is built with Next.js 14 using the App Router, TypeScript, and Tailwind CSS. Supabase is used as the backend, providing PostgreSQL as the database along with Row Level Security. Authentication is handled through Supabase Auth using Google OAuth. Realtime updates are implemented using Supabase Realtime with postgres_changes, and profile images are managed through Supabase Storage.

---

## What Ace Mark Does

Ace Mark allows users to sign in using Google OAuth and manage their own private collection of bookmarks. Each user can add, update, delete, and favorite bookmarks, with all changes reflected in realtime without requiring a page refresh. Favorite bookmarks are visually highlighted and prioritized in the UI. The application also includes a profile page where users can update their name and upload a profile picture. All user data is securely isolated at the database level using Row Level Security.

---

## Starting Point and Initial Knowledge Gaps

When I started building Ace Mark, my experience with Supabase was very limited. I did not have a clear understanding of how the Supabase client established connections, how authentication state affected database access, or how realtime updates were tied to PostgreSQL behavior. I also had never implemented Google OAuth end to end on my own, and I had no prior experience working with Supabase Storage.

Instead of avoiding these areas, I treated this project as an opportunity to learn them properly by building a real system and dealing with real issues as they came up.

---

## Issues Faced and How I Solved Them

One of the first challenges I faced was understanding how the Supabase connection actually worked. Authentication appeared to succeed and the UI rendered correctly, but database operations behaved inconsistently. This initially made debugging difficult because nothing looked obviously broken on the frontend. I eventually realized that environment variable changes were not being applied because the development server was not restarted. By verifying the database state directly using SQL and ensuring the correct project URL and keys were being used, I was able to stabilize the connection. This taught me not to rely solely on frontend behavior when debugging backend issues.

Another major issue involved Google OAuth. The login flow either failed silently or returned validation errors, even though OAuth appeared to be configured correctly in the Supabase dashboard. The root cause turned out to be improper passing of Supabase keys through environment variables. Once I verified the correct publishable key and ensured the variables were named and loaded correctly, the OAuth flow started working as expected. This experience reinforced the idea that many authentication issues are configuration problems rather than logic errors.

Realtime behavior was another area that caused confusion. While adding bookmarks updated the UI instantly, updating or deleting bookmarks only reflected after a page refresh. At first, this seemed like a frontend subscription problem, but the real issue was in the database configuration. Update operations were missing proper Row Level Security checks, and delete events were not being emitted because PostgreSQL was not configured to send old row data. Fixing the RLS policies and enabling full replica identity resolved the issue. This made it clear that realtime systems depend just as much on database setup as on frontend code.

Profile image uploads introduced a different set of challenges. Initially, uploads failed with a “bucket not found” error, which was caused by a missing or misnamed storage bucket. After fixing that, images uploaded successfully but did not appear in the UI or disappeared after a refresh. The problem turned out to be aggressive browser caching of the image URL. Adding a simple cache-busting query parameter to the image source resolved the issue. This highlighted the importance of understanding storage and CDN behavior in production-like systems.

I also ran into routing issues with the Next.js App Router. Clicking the profile link appeared to do nothing, which was confusing at first. The actual issue was a missing folder-based route and the need to restart the development server after adding it. This reinforced the idea that routing issues in the App Router are often filesystem related rather than logical errors.

Finally, I wanted to ensure that user data would never collide. Since every bookmark row includes a user_id and all access is restricted using Row Level Security with auth.uid(), users are fully isolated from one another. No privileged keys are used on the frontend, which ensures that one user cannot read or modify another user’s data.

---

## Security Model

All user-related tables use Row Level Security to enforce access control at the database level. Users can only read and write their own data. Storage uploads are restricted to authenticated users, while public access is limited to reading avatar images. This ensures that security is enforced by the backend rather than relying on frontend logic.

---

## Realtime Design

Realtime functionality is implemented using Supabase postgres_changes subscriptions. The UI reacts to insert, update, and delete events emitted by the database, keeping the interface in sync without polling or manual refreshes. Bookmarks are re-sorted after every event so that favorites always remain prioritized.

---

## Interview Context and Takeaway

Ace Mark is not meant to be a flashy UI project. Its value lies in the way it reflects how I work with unfamiliar tools, debug configuration and backend issues, and build a deeper understanding of systems like authentication, realtime data flow, and database security. The project represents how I think when things break, not just when they work.

I did not start this project with strong knowledge of Supabase. I finished it with a much clearer understanding of configuration, authentication, Row Level Security, realtime systems, and storage behavior. I am comfortable explaining any issue, fix, or design decision in detail.

---

**Status:** Stable, secure, realtime, and interview-ready