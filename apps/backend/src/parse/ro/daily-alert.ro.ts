import { ApiProperty } from '@nestjs/swagger';

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
  date: Date;
}
