import { IsInt, IsOptional, IsString, IsDateString, Min, Max, MaxLength } from 'class-validator';

export class CreateTimeEntryDto {
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UpdateTimeEntryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
