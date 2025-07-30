import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { UpdateService } from '../services/update.service';

interface UpdateOptions {
  check?: boolean;
}

@Injectable()
@Command({
  name: 'update',
  description: 'Update Superjolt CLI to the latest version',
})
export class UpdateCommand extends CommandRunner {
  constructor(private readonly updateService: UpdateService) {
    super();
  }

  async run(passedParams: string[], options: UpdateOptions): Promise<void> {
    try {
      if (options.check) {
        // Just check for updates, don't install
        await this.updateService.checkForUpdates(true);
      } else {
        // Perform manual update
        await this.updateService.manualUpdate();
      }
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '-c, --check',
    description: 'Only check for updates without installing',
  })
  parseCheck(): boolean {
    return true;
  }
}
