import type { Session, User } from "@/server/data/schema";

export type SessionValidationResult = {
    session: Session | null,
    user: User | null
}