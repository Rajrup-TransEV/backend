import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderedItemDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to check if products exist
  private async validateProducts(
    orderedItems: CreateOrderDto['orderedItems'],
  ): Promise<string[]> {
    const productIds = orderedItems.map((item) => item.productId);

    // Fetch products that exist
    const existingProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const existingProductIds = existingProducts.map((product) => product.id);
    const missingProductIds = productIds.filter(
      (id) => !existingProductIds.includes(id),
    );

    return missingProductIds;
  }

  // Create an order
  async create(createOrderDto: CreateOrderDto) {
    const missingProductIds = await this.validateProducts(
      createOrderDto.orderedItems,
    );

    if (missingProductIds.length > 0) {
      throw new BadRequestException(
        `Invalid product IDs: ${missingProductIds.join(', ')}`,
      );
    }

    const orderItemsWithUnits = [];

    for (const orderedItem of createOrderDto.orderedItems) {
      const { productId, quantity } = orderedItem;

      const availableUnits = await this.prisma.unit.findMany({
        where: { productId },
        take: quantity,
      });

      if (availableUnits.length < quantity) {
        throw new BadRequestException(
          `Not enough units for product ID: ${productId}`,
        );
      }

      const assignedUnits = availableUnits.map((unit) => unit.id);
      orderItemsWithUnits.push({ productId, quantity, assignedUnits });

      // Update product quantity
      await this.prisma.product.update({
        where: { id: productId },
        data: { quantity: { decrement: quantity } },
      });

      // Delete assigned units
      await this.prisma.unit.deleteMany({
        where: { id: { in: assignedUnits } },
      });
    }

    return this.prisma.order.create({
      data: {
        user: { connect: { id: createOrderDto.userId } },
        orderedItems: JSON.stringify(orderItemsWithUnits), // Serialize array as JSON
        shipmentCompany: createOrderDto.shipmentCompany,
        shipmentStatus: createOrderDto.shipmentStatus,
        paymentStatus: createOrderDto.paymentStatus,
      },
    });
  }

  // Update an order
  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const existingOrder = await this.prisma.order.findUnique({ where: { id } });

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (updateOrderDto.orderedItems) {
      const missingProductIds = await this.validateProducts(
        updateOrderDto.orderedItems,
      );

      if (missingProductIds.length > 0) {
        throw new BadRequestException(
          `Invalid product IDs: ${missingProductIds.join(', ')}`,
        );
      }

      for (const orderedItem of updateOrderDto.orderedItems) {
        const { productId, quantity } = orderedItem;

        const availableUnits = await this.prisma.unit.findMany({
          where: { productId },
          take: quantity,
        });

        if (availableUnits.length < quantity) {
          throw new BadRequestException(
            `Not enough units for product ID: ${productId}`,
          );
        }

        const assignedUnits = availableUnits.map((unit) => unit.id);
        orderedItem.assignedUnits = assignedUnits;

        // Update product quantity
        await this.prisma.product.update({
          where: { id: productId },
          data: { quantity: { decrement: quantity } },
        });

        // Delete assigned units
        await this.prisma.unit.deleteMany({
          where: { id: { in: assignedUnits } },
        });
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        orderedItems: JSON.stringify(updateOrderDto.orderedItems), // Serialize array as JSON
        shipmentCompany: updateOrderDto.shipmentCompany,
        shipmentRequestStatus: updateOrderDto.shipmentRequestStatus,
        shipmentStatus: updateOrderDto.shipmentStatus,
        invoice: updateOrderDto.invoice,
        refundStatus: updateOrderDto.refundStatus,
        refundDetails: updateOrderDto.refundDetails,
        shippingCost: updateOrderDto.shippingCost,
        orderingStatus: updateOrderDto.orderingStatus,
        orderFulfillmentStatus: updateOrderDto.orderFulfillmentStatus,
        prePayment: updateOrderDto.prePayment,
        paymentStatus: updateOrderDto.paymentStatus,
      },
    });
  }

  // Delete an order
  async remove(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const orderItems: OrderedItemDto[] = JSON.parse(
      order.orderedItems as string,
    );

    for (const item of orderItems) {
      const { productId, assignedUnits } = item;

      // Restore units
      await this.prisma.unit.createMany({
        data: assignedUnits.map((unitId) => ({
          id: unitId,
          productId: productId,
        })),
      });

      // Update product quantity
      await this.prisma.product.update({
        where: { id: productId },
        data: { quantity: { increment: assignedUnits.length } },
      });
    }

    return this.prisma.order.delete({
      where: { id },
    });
  }
}
