import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  description: string;

  @IsString()
  originAddress: string;

  @IsString()
  destinationAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;
}
