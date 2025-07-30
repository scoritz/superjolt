import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UpdateService } from '../services/update.service';

@Injectable()
export class UpdateCheckHook implements OnApplicationBootstrap {
  constructor(private readonly updateService: UpdateService) {}

  async onApplicationBootstrap() {
    // Check for updates after a small delay to not block the command
    setTimeout(() => {
      void this.updateService.checkForUpdates();
    }, 100);
  }
}
