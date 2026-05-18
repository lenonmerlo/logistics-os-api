import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ClientsService } from '../clients/clients.service';
import { DriversService } from '../drivers/drivers.service';
import { Driver, DriverStatus } from '../drivers/driver.entity';

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

      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new BadRequestException('Driver is not available');
      }
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
      order.status = updateOrderDto.status;
      await this.syncDriverStatus(order);
    }

    if (updateOrderDto.driverId) {
      const driver = await this.driversService.findOne(updateOrderDto.driverId);

      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new BadRequestException('Driver is not available');
      }

      order.driver = driver;
    }

    if (updateOrderDto.notes) {
      order.notes = updateOrderDto.notes;
    }

    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    const cancellableStatuses = [OrderStatus.CREATED, OrderStatus.DISPATCHED];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Only orders with CREATED or DISPATCHED status can be deleted',
      );
    }

    await this.orderRepository.remove(order);
  }

  private async syncDriverStatus(order: Order): Promise<void> {
    if (!order.driver) return;

    const driver = await this.driversService.findOne(order.driver.id);

    const onDeliveryStatuses = [
      OrderStatus.DISPATCHED,
      OrderStatus.COLLECTED,
      OrderStatus.IN_TRANSIT,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERY_FAILED,
    ];

    const releasedStatuses = [
      OrderStatus.DELIVERED,
      OrderStatus.RETURNED,
      OrderStatus.CANCELLED,
    ];

    if (onDeliveryStatuses.includes(order.status)) {
      await this.driversService.update(driver.id, {
        status: DriverStatus.ON_DELIVERY,
      });
    } else if (releasedStatuses.includes(order.status)) {
      await this.driversService.update(driver.id, {
        status: DriverStatus.AVAILABLE,
      });
    }
  }

  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
      [OrderStatus.DISPATCHED]: [OrderStatus.COLLECTED, OrderStatus.CANCELLED],
      [OrderStatus.COLLECTED]: [OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.DELIVERED,
        OrderStatus.DELIVERY_FAILED,
      ],
      [OrderStatus.DELIVERY_FAILED]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.RETURNED,
      ],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid status transition: ${current} → ${next}`,
      );
    }
  }
}
