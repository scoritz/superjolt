import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpService } from './mcp.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { StorageService } from '../services/storage.service';
import { LoggerService, LOGGER_OPTIONS } from '../services/logger.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
  ],
  providers: [
    McpService,
    ApiService,
    AuthService,
    ConfigService,
    StorageService,
    {
      provide: LOGGER_OPTIONS,
      useValue: { silent: true },
    },
    LoggerService,
  ],
  exports: [McpService],
})
export class McpModule {}
