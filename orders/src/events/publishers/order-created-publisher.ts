import { Publisher, OrderCreatedEvent, Subjects } from '@qatickets/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}