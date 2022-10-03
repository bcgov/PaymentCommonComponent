import { IsNotEmpty, IsIn, IsString, Length, IsDate } from 'class-validator';
export class SalesDTO {

    @IsString()
    @IsNotEmpty()
    id!: string;

    @IsString()
    @Length(1, 256)
    @IsIn(['CASH', 'CHQ', 'POS_CREDIT', 'POS_DEBIT', 'ONL_CREDIT', 'ONL_DEBIT'])
    method!: string;

    @IsString()
    @IsNotEmpty()
    credit_gl!: string;

    @IsString()
    @IsNotEmpty()
    debit_gl!: string;

    @IsString()
    @IsNotEmpty()
    @IsDate()
    sale_timestamp!: string;
    
}
