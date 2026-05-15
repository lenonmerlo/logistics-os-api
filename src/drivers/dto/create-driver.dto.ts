import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DriverStatus } from '../driver.entity';

export class CreateDriverDto {
  @IsString()
  name: string;

  @IsString()
  @MinLength(11)
  document: string;

  @IsString()
  licenseNumber: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
