import { generateRandomString } from "@oslojs/crypto/random";

import type { RandomReader } from "@oslojs/crypto/random";



export function generateId(length: number): string {

    const random: RandomReader = {
        read(bytes) {
            crypto.getRandomValues(bytes);
        }
    };

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    return generateRandomString(random, alphabet, length);
}