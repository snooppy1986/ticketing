import express, { Request, Response } from "express";
import { Order, OrderStatus } from "../models/order";
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from "@qatickets/common";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";
import { natsWrapper } from "../nats-wraper";

const router = express.Router();

router.delete(
  "/api/orders/:orderId",
  requireAuth,
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('ticket');

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    order.status = OrderStatus.Cancelled;
    await order.save();

    new OrderCancelledPublisher(natsWrapper.client).publish({
      id: order._id.toHexString(),
      version: order.version,
      ticket: {
        id: order.ticket._id.toHexString(),
      },
    });

    res.status(204).send(order);
  },
);

export { router as deleteOrdersRouter };
