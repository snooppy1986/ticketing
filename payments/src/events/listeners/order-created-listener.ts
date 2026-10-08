import { Listener, OrderCreatedEvent, Subjects } from "@qatickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    const existingOrder = await Order.findById(data.id);
    if (existingOrder) {
      return msg.ack();
    }

    try {
      const order = Order.build({
        id: data.id,
        price: data.ticket.price,
        status: data.status,
        userId: data.userId,
        version: data.version,
      });
      await order.save();
    } catch (err: any) {
      // Concurrent redelivery can race past the findById check
      if (err.code === 11000) {
        return msg.ack();
      }
      throw err;
    }

    msg.ack();
  }
}
