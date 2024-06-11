import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { RedisService } from './services';
import { RedisStateService } from './services/redis-state.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: redisStore,
                host: config.getOrThrow<string>('REDIS_HOST'),
                port: config.getOrThrow<number>('REDIS_PORT'),
                password: config.getOrThrow<string>('REDIS_PASSWORD'),
                ttl: config.get<number>('CACHE_TTL') ?? 60, // time to live in seconds
                max: config.get<number>('CACHE_MAX') ?? 5000000, // maximum number of items in cache
            }),
        }),
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new Redis({
                    host: config.getOrThrow<string>('REDIS_HOST'),
                    port: config.getOrThrow<number>('REDIS_PORT'),
                    password: config.getOrThrow<string>('REDIS_PASSWORD'),
                    connectTimeout: Number(config.get<number>('REDIS_CONNECT_TIMEOUT')) || 5000,
                    maxRetriesPerRequest: null,
                    reconnectOnError: () => {
                        const reconnectAndResendFailedCmd = 2;
                        return reconnectAndResendFailedCmd;
                    },
                } as RedisOptions);
            },
        },
        RedisStateService,
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
