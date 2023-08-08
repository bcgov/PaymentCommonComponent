import {
  Controller,
  Get,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBasicAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { AuthGuard } from './common/guards/auth.guard';

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

  @ApiBasicAuth()
  @UseGuards(AuthGuard)
  @Get('/health')
  @ApiOperation({})
  getHealth(): object {
    return {
      status: 'ok',
    };
  }
}
