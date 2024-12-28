// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { User, Session } from '@clairvue/types';
declare global {
  namespace App {
    interface Locals {
      authSession: {
        session: Session;
        user: User;
      }
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
