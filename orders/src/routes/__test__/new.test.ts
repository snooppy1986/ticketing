import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { Order } from '../../models/order';
import { OrderStatus } from '@qatickets/common';
import { natsWrapper } from '../../nats-wraper';

it('returns an error if the ticket does not exist', async () => {
    const ticketId = new mongoose.Types.ObjectId();
    const response = await request(app)
    .post('/api/orders')
    .set('Cookie', await global.signin())
    .send({
        ticketId: ticketId,
    });
    expect(response.status).toEqual(404);
});

it('returns an error if the ticket is already reserved', async () => {
    const ticket = Ticket.build({       
        id: new mongoose.Types.ObjectId().toString(),
        title: 'concert',
        price: 20,
    });
    await ticket.save();
    const order = Order.build({
        ticket: ticket,
        userId: 'askdfalhsdhjfa',
        status: OrderStatus.Created,
        expiresAt: new Date(),
    });
    await order.save();
    const response = await request(app)
    .post('/api/orders')
    .set('Cookie', await global.signin())
    .send({
        ticketId: ticket._id,
    });
    expect(response.status).toEqual(400);
});

it('reserves a ticket', async () => {
    const ticket = Ticket.build({        
        id: new mongoose.Types.ObjectId().toString(),
        title: 'concert',
        price: 20,
    });
    await ticket.save();
    await request(app)
    .post('/api/orders')
    .set('Cookie', await global.signin())
    .send({
        ticketId: ticket._id,
    }).expect(201);    
});

it('emits an order created event', async () => {
    const ticket = Ticket.build({        
        id: new mongoose.Types.ObjectId().toString(),
        title: 'concert',
        price: 20,
    });
    await ticket.save();
    await request(app)
    .post('/api/orders')
    .set('Cookie', await global.signin())
    .send({
        ticketId: ticket._id,
    }).expect(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});