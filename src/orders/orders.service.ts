import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { Driver, DriverStatus } from '../drivers/driver.entity';
import { DriversService } from '../drivers/drivers.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderStatus } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly clientsService: ClientsService,
    private readonly driversService: DriversService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const client = await this.clientsService.findOne(createOrderDto.clientId);

    let driver: Driver | undefined = undefined;
    if (createOrderDto.driverId) {
      driver = await this.driversService.findOne(createOrderDto.driverId);
    }

    const order = this.orderRepository.create({
      description: createOrderDto.description,
      originAddress: createOrderDto.originAddress,
      destinationAddress: createOrderDto.destinationAddress,
      notes: createOrderDto.notes,
      client,
      driver,
    });

    return this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateOrderDto.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
    }

    if (updateOrderDto.driverId) {
      const driver = await this.driversService.findOne(updateOrderDto.driverId);

      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new BadRequestException('Driver is not available');
      }

      order.driver = driver;
    }

    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }

    if (updateOrderDto.notes) {
      order.notes = updateOrderDto.notes;
    }

    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (order.status !== OrderStatus.CREATED) {
      throw new BadRequestException(
        'Only orders with CREATED status can be deleted',
      );
    }

    await this.orderRepository.remove(order);
  }

  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.COLLECTED, OrderStatus.CANCELLED],
      [OrderStatus.COLLECTED]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid status transition: ${current} → ${next}`,
      );
    }
  }
}
