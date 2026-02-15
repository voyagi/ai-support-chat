import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

/** Singleton Redis client. Reuses one connection across all modules. */
export function getRedis(): Redis {
	if (!_redis) {
		_redis = Redis.fromEnv();
	}
	return _redis;
}
