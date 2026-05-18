import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  notes?: string;
}
