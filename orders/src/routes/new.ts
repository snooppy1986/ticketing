import mongoose from "mongoose";
import express, { Request, Response } from "express";
import { requireAuth, validateRequest, NotFoundError, OrderStatus, BadRequestError } from "@qatickets/common";
import { body } from "express-validator";
import { Ticket } from "../models/ticket";
import { Order } from "../models/order";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { natsWrapper } from "../nats-wraper";

const router = express.Router();
const EXPIRATION_WINDOW_SECONDS = 1 * 60;


router.post(
  "/api/orders",
  requireAuth,
  [
    body("ticketId")
      .not()
      .isEmpty()
      .withMessage("Ticket ID is required")
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("Ticket ID must be a valid MongoDB ID"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } =await req.body;
    console.log("ticketId", ticketId);
    // Find the ticket the user is trying to order in the database
    const ticket = await Ticket.findById(ticketId);   
    console.log("ticket", ticket);
    if (!ticket) {
      throw new NotFoundError();
    }
    // Make sure that the ticket is not already reserved    
    const isReserved = await ticket.isReserved();
    if (isReserved) {
      throw new BadRequestError("Ticket is already reserved");
    }
    //Calculate an expiration date for this order
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // Build the order and save it to the database
    const order = Order.build({
      ticket,
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
    });    
    await order.save();

    // Publish an event saying that an order was created
    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order._id.toString(),
      version: order.version,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    });

    res.status(201).send(order);
  },
);

export { router as newOrdersRouter };
