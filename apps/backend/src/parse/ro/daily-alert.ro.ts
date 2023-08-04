import { ApiProperty } from '@nestjs/swagger';
import { ProgramRequiredFileEntity } from '../entities/program-required-file.entity';

class DailyAlertProgramRO {
  @ApiProperty({
    description: 'The program for this alert',
    example: 'SBC',
    required: true,
  })
  program: string;

  @ApiProperty({
    description: 'Successful daily upload',
    example: false,
    required: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Whether an alert was sent about this daily',
    example: true,
    required: true,
  })
  alerted: boolean;

  @ApiProperty({
    description: 'List of file types that are missing',
    example: [],
    required: false,
  })
  missingFiles: ProgramRequiredFileEntity[];
}

export class DailyAlertRO {
  @ApiProperty({
    description: 'List of programs and alert status for the day',
    required: true,
  })
  dailyAlertPrograms: DailyAlertProgramRO[];

  @ApiProperty({
    description: 'Date of daily',
    required: true,
  })
  date: string;
}
