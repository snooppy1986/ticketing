import request from "supertest";
import { app } from "../../app";
import mongoose from "mongoose";
import { Order } from "../../models/order";
import { OrderStatus } from "@qatickets/common";
import { stripe } from "../../stripe";
import { Payment } from "../../models/payment";

it("returns a 404 when the route is not found", async () => {
  await request(app)
    .post("/api/payments")
    .set("Cookie", await global.signin())
    .send({
      orderId: new mongoose.Types.ObjectId().toHexString(),
      token: "tok_visa",
    })
    .expect(404);
});

it("returns a 401 when purchasing an order that does not belong to the user", async () => {
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    price: 20,
    status: OrderStatus.Created,
    version: 0,
  });
  await order.save();

  await request(app)
    .post("/api/payments")
    .set("Cookie", await global.signin())
    .send({
      orderId: order.id,
      token: "tok_visa",
    })
    .expect(401);
});
it("returns a 400 when purchasing a cancelled order", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId: userId,
        price: 20,
        status: OrderStatus.Cancelled,
        version: 0,
    });
    await order.save();

    await request(app)
     .post("/api/payments")
     .set("Cookie", await global.signin(userId))
     .send({
        orderId: order.id,
        token: "tok_visa",
     })
     .expect(400);
});

it("returns a 201 with valid inputs", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const price = Math.floor(Math.random() * 100000);
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId: userId,
        price: price,
        status: OrderStatus.Created,
        version: 0,
    });
    await order.save()
    
    await request(app)
     .post("/api/payments")
     .set("Cookie", await global.signin(userId))
     .send({
        orderId: order.id,
        token: "tok_visa",
     })
     .expect(201);

   const paymentIntents = await stripe.paymentIntents.list({
    limit: 50,
   });
   const paymentIntent = paymentIntents.data.find(
     (intent) => intent.amount === price * 100,
   );
   expect(paymentIntent).toBeDefined();
   expect(paymentIntent!.currency).toEqual("usd");
   expect(paymentIntent!.status).toEqual("succeeded");

   const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: paymentIntent!.id,
   });
   expect(payment).not.toBeNull();
});
