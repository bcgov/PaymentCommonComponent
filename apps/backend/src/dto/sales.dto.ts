import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Length, ArrayMinSize, ArrayNotEmpty, IsArray, ValidateIf, ValidateNested, IsDateString, IsNumber, IsDefined, IsNotEmptyObject } from 'class-validator';
import { DistributionDTO } from './distribution.dto';
export class SalesDTO {
    @IsString()
    @IsNotEmpty()
    id!: string;

    @IsString()
    @IsNotEmpty()
    @IsDateString()
    sale_date!: string;

    @IsString()
    @IsNotEmpty()
    journal_name!: string;

    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    ministry_alpha_identifier!: string;

    // 25.25 - Amount 
    @IsNumber()
    @IsNotEmpty()
    total_amount!: number;


    // TODO - Does not validate if the array items don't exist
    @IsDefined()
    @ValidateNested({ each: true })
    @Type(() => DistributionDTO)
    @IsArray()
    @ArrayMinSize(2, { message: 'At least 2 credit and debit distribution is required' })
    @ArrayNotEmpty({ message: 'Distribution is required' })
    @ValidateIf(e => (e?.distributions?.length || 0) > 0)
    distributions!: DistributionDTO[];
}
