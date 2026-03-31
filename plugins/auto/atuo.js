export default async (before, m, { conn }) => {
    const g = global.db?.groups[m.chat];
    const u = global.db?.users[m.sender];
    
    // Check if user is banned
    if (u?.banned && !m.isOwner) return true;
    
    // Check admin-only groups
    if (g?.adminOnly && !m.isOwner && !m.isAdmin) return true;
    
    // Check owner-only mode for private chat
    if (global.db?.dev && !m.isOwner && !m.isGroup) return true;
    
    // Check owner-only mode globally
    if (global.db?.ownerOnly && !m.isOwner) return true;
    
    return false;
};