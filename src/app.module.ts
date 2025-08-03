import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MachineCreateCommand } from './commands/machine-create.command';
import { MachineListCommand } from './commands/machine-list.command';
import { MachineDeleteCommand } from './commands/machine-delete.command';
import { MachineUseCommand } from './commands/machine-use.command';
import { MachineRenameCommand } from './commands/machine-rename.command';
import { ServiceListCommand } from './commands/service-list.command';
import { ServiceStartCommand } from './commands/service-start.command';
import { ServiceStopCommand } from './commands/service-stop.command';
import { ServiceRestartCommand } from './commands/service-restart.command';
import { ServiceDeleteCommand } from './commands/service-delete.command';
import { ServiceRenameCommand } from './commands/service-rename.command';
import { EnvSetCommand } from './commands/env-set.command';
import { EnvGetCommand } from './commands/env-get.command';
import { EnvListCommand } from './commands/env-list.command';
import { EnvUnsetCommand } from './commands/env-unset.command';
import { EnvPushCommand } from './commands/env-push.command';
import { DeployCommand } from './commands/deploy.command';
import { LogsCommand } from './commands/logs.command';
import { ResetCommand } from './commands/reset.command';
import { MeCommand } from './commands/me.command';
import { LoginCommand } from './commands/login.command';
import { LogoutCommand } from './commands/logout.command';
import { UpdateCommand } from './commands/update.command';
import { StatusCommand } from './commands/status.command';
import { DomainAddCommand } from './commands/domain-add.command';
import { DomainListCommand } from './commands/domain-list.command';
import { DomainRemoveCommand } from './commands/domain-remove.command';
import { DomainStatusCommand } from './commands/domain-status.command';
import { ApiService } from './services/api.service';
import { ConfigService } from './services/config.service';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';
import { UpdateService } from './services/update.service';
import { LoggerService } from './services/logger.service';
import { UpdateCheckHook } from './hooks/update-check.hook';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
  ],
  providers: [
    MachineCreateCommand,
    MachineListCommand,
    MachineDeleteCommand,
    MachineUseCommand,
    MachineRenameCommand,
    ServiceListCommand,
    ServiceStartCommand,
    ServiceStopCommand,
    ServiceRestartCommand,
    ServiceDeleteCommand,
    ServiceRenameCommand,
    EnvSetCommand,
    EnvGetCommand,
    EnvListCommand,
    EnvUnsetCommand,
    EnvPushCommand,
    DeployCommand,
    LogsCommand,
    ResetCommand,
    MeCommand,
    LoginCommand,
    LogoutCommand,
    UpdateCommand,
    StatusCommand,
    DomainAddCommand,
    DomainListCommand,
    DomainRemoveCommand,
    DomainStatusCommand,
    ApiService,
    ConfigService,
    AuthService,
    StorageService,
    UpdateService,
    LoggerService,
    UpdateCheckHook,
  ],
})
export class AppModule {}
