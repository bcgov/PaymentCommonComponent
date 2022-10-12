import { IsNotEmpty, IsIn, IsString, Length, IsCurrency, IsDateString, isNotEmpty, isIn, IsNumber } from 'class-validator';
export class DistributionDTO {

    // 00001 
    @IsString()
    @IsNotEmpty()
    @Length(5,5)
    line_number!: string; 

    // 130 - Agriculture 
    @IsString()
    @IsNotEmpty()
    @Length(3,3)
    dist_ministry_code!: string;

    // 29KGT - Resp Code
    @IsString()
    @IsNotEmpty()
    @Length(5,5)
    dist_resp_code!: string;

    // 38513 - Line Code
    @IsString()
    @IsNotEmpty()
    @Length(5,5)
    dist_line_code!: string;
    
    // 4303 - STOB
    @IsString()
    @IsNotEmpty()
    @Length(4,4)
    dist_stob_code!: string;
    
    // 29K0230 - Project Code
    @IsString()
    @IsNotEmpty()
    @Length(7,7)
    dist_project_code!: string;
    
    // 000000 - Location Code
    @IsString()
    @IsNotEmpty()
    @Length(6,6)
    dist_location_code!: string;

    // 0000 - Future Code
    @IsString()
    @IsNotEmpty()
    @Length(4,4)
    dist_future_code!: string;    

    // 25.25 - Line Amount 
    @IsNumber()
    @IsNotEmpty()
    line_amount!: number;    

    // C or D - Credit or Debit 
    @IsString()
    @IsNotEmpty()
    @IsIn(['C', 'D'])
    line_code!: string;    

    // 
    @IsString()
    @IsNotEmpty()
    line_description!: string;    

    // GL Effective Date
    @IsDateString()
    @IsNotEmpty()
    gl_date!: Date;

    // Supplier Code 
    @IsString()
    supplier_code!: string;

    @IsString()
    @Length(1, 256)
    @IsIn(['CASH', 'CHQ', 'POS_CREDIT', 'POS_DEBIT', 'ONL_CREDIT', 'ONL_DEBIT'])
    method!: string;

    // 550 - Fish Trade Licenses
    // @IsString()
    // @IsNotEmpty()
    // service_code!: string;
    
}
