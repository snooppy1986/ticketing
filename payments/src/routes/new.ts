import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  BadRequestError,
  OrderStatus,
  NotAuthorizedError,
} from "@qatickets/common";
import { Order } from "../models/order";
import { stripe } from "../stripe";
import { Payment } from "../models/payment";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";
import { natsWrapper } from "../nats-wraper";

const router = express.Router();

router.post(
  "/api/payments",
  requireAuth,
  [
    body("orderId").not().isEmpty().withMessage("Order ID is required"),
    body("token").not().isEmpty().withMessage("Token is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { orderId, token } = req.body;
    console.log("orderId", orderId);
    const order = await Order.findById(orderId);
    console.log("order", order);
    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError(
        "You cannot create a payment for a cancelled order",
      );
    }

    // Charges + card tokens are EOL; convert token → PaymentMethod → PaymentIntent.
    let paymentIntent;
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token },
      });

      paymentIntent = await stripe.paymentIntents.create({
        amount: order.price * 100,
        currency: "usd",
        payment_method: paymentMethod.id,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });
    } catch (err: any) {
      throw new BadRequestError(err.message || "Payment failed");
    }

    const payment = Payment.build({
      orderId: orderId,
      stripeId: paymentIntent.id,
    });
    await payment.save();

    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    });

    res.status(201).send({ id: payment.id });
  },
);

export { router as createChargeRouter };
