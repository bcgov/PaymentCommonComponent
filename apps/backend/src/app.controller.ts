import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('Health API')
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

  @Get('/health')
  @ApiOperation({})
  getHealth(): object {
    return {
      status: 'ok',
    };
  }
}
