-- Shared workspaces: exactly two members per room, invitations expire after 7 days.
CREATE TABLE IF NOT EXISTS pair_rooms (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 invite_hash TEXT NOT NULL UNIQUE,
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pair_rooms_owner ON pair_rooms(owner_id);
CREATE TABLE IF NOT EXISTS pair_members (
 room_id TEXT NOT NULL REFERENCES pair_rooms(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 joined_at INTEGER NOT NULL,
 PRIMARY KEY(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS pair_members_user ON pair_members(user_id);
