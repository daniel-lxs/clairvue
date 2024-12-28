export interface User {
  id: string;
  username: string;
  hashedPassword: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
}
