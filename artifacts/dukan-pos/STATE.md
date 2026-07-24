# Dukan POS - Current State & Handoff

## What We Have Built So Far
- **App Stack**: React, Wouter, TailwindCSS, Lucide Icons, deployed on Vercel.
- **Supabase Integration**: The app is connected to Supabase for authentication, storage, and real-time multiplayer syncing across devices.
- **Dynamic Profiles**: The app pulls the Store Name and Owner Name dynamically from the logged-in user's Supabase metadata and prints it correctly on receipts and UI.
- **Seed Data**: We injected 40 real-world Pakistani Cash & Carry items (Shan Masalas, Olper's, Lays, Ariel, etc.) into the database.
- **Realtime Sync MVP**: Implemented Supabase Realtime WebSockets. When one device connects, it listens for database updates and instantly updates the local React state without needing a refresh.

## The Bug We Discovered
During testing, we encountered an **Offline-First Sync Conflict (Race Condition)**:
- Phone A sold an item offline. Stock dropped from 5 to 4.
- The Laptop had stale state (5). Due to a bug in the initial sync engine, the laptop pushed its stale state back to the cloud, overriding Phone A's work and reverting stock to 5.
- I fixed the bug by separating Pull logic and preventing the app from pushing on load, and adding a Realtime WebSocket listener to keep devices updated.

## The Pending Architecture Upgrade (Crucial)
The user correctly identified that if two devices are completely offline at the same time and both make sales, simply "Timestamp Merging" their data when they reconnect will result in lost inventory math.

**The Solution we agreed upon (Event Sourcing & DB Triggers):**
1. Currently, the React app mathematically calculates absolute stock (`stock = 4`) and pushes the absolute number to the `products` table.
2. **NEXT STEP**: We must move the math to the PostgreSQL database.
3. The React app must **ONLY push the Transaction Event** (e.g., "I sold 1 unit of Pantene") to the `sales` table.
4. We must write a **Supabase Database Trigger** that listens for new sales being inserted, and safely decrements the `stock` amount directly inside the database, preventing any concurrent overwrite issues.

## AI Instructions for Next Session
When the user returns and tells you to continue:
1. You must write the SQL Trigger that automatically decrements product stock when a sale is inserted.
2. You must modify `App.tsx`'s `useEffect` Live Push engine to completely stop updating the `products` table during checkout. It should only push to the `sales` table.
3. Ensure the Offline queue logic simply buffers `sales` inserts while offline and pushes them all sequentially when internet returns.
