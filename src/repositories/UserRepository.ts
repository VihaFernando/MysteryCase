import type { AuditEntry, Notification, Role, User } from "@/types";
import { clone, delay, getDb, persistDb } from "./localDb";

export const userRepository = {
  async list(): Promise<User[]> { await delay(); return clone(getDb().users); },
  async roles(): Promise<Role[]> { await delay(); return clone(getDb().roles); },
  async updateRole(role: Role): Promise<Role> {
    await delay(150);
    const db = getDb();
    db.roles = db.roles.map((r) => (r.id === role.id ? role : r));
    persistDb();
    return role;
  },
  async update(user: User): Promise<User> {
    await delay(150);
    const db = getDb();
    const i = db.users.findIndex((u) => u.id === user.id);
    if (i >= 0) db.users[i] = user; else db.users.push(user);
    persistDb();
    return user;
  },
  async audit(): Promise<AuditEntry[]> { await delay(); return clone(getDb().audit); },
  async log(entry: Omit<AuditEntry, "id" | "timestamp">) {
    const db = getDb();
    db.audit.unshift({ ...entry, id: `al-${Date.now()}`, timestamp: new Date().toISOString() });
    persistDb();
  },
};

export const notificationRepository = {
  async list(): Promise<Notification[]> { await delay(); return clone(getDb().notifications); },
  async push(n: Omit<Notification, "id" | "createdAt" | "read">) {
    const db = getDb();
    const item: Notification = { ...n, id: `n-${Date.now()}`, createdAt: new Date().toISOString(), read: false };
    db.notifications.unshift(item);
    persistDb();
    return item;
  },
  async markRead(id: string) { const db = getDb(); db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)); persistDb(); },
  async markAllRead() { const db = getDb(); db.notifications = db.notifications.map((n) => ({ ...n, read: true })); persistDb(); },
};
