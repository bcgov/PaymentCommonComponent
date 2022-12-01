import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/version')
  getVersion(): object {
    return this.appService.getVersionInfo();
  }

  @Get('/error')
  getError(): object {
    throw new InternalServerErrorException('Breaking uptime');
  }
}
