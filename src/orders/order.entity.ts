import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Driver } from '../drivers/driver.entity';

export enum OrderStatus {
  CREATED = 'CREATED',
  DISPATCHED = 'DISPATCHED',
  COLLECTED = 'COLLECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERED_FAILED = 'DELIVERED_FAILED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column()
  originAddress: string;

  @Column()
  destinationAddress: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn()
  client: Client;

  @ManyToOne(() => Driver, { eager: true, nullable: true })
  @JoinColumn()
  driver: Driver;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
