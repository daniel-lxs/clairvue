export {};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			PRIVATE_DB_URL: string;
		}
	}
}
