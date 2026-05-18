import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { ClientsModule } from 'src/clients/clients.module';
import { DriversModule } from 'src/drivers/drivers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), ClientsModule, DriversModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
