import { natsWrapper } from "../../../nats-wraper";
import { TicketUpdatedListener } from "../ticket-updated-listener";
import { Ticket } from "../../../models/ticket";
import mongoose from "mongoose";
import { TicketUpdatedEvent } from "@qatickets/common";
import { Message } from "node-nats-streaming";

const setup = async () => {
    const listener = new TicketUpdatedListener(natsWrapper.client);

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toString(),
        title: 'concert',
        price: 10,
    });
    await ticket.save();

    const data: TicketUpdatedEvent['data'] = {        
        id: ticket.id,
        version: ticket.version + 1,
        title: 'new concert',
        price: 999,
        userId: new mongoose.Types.ObjectId().toString(),
    };

    // @ts-ignore
    const msg: Message = {
        ack: jest.fn(),
    };

    return { listener, data, msg, ticket };
}

it('finds, updates, and saves a ticket', async () => {
    const { listener, data, msg, ticket } = await setup();
    await listener.onMessage(data, msg);
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket).toBeDefined();
    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
    expect(updatedTicket!.version).toEqual(data.version);
})

it('acks the message', async () => {
    const { listener, data, msg } = await setup();
    await listener.onMessage(data, msg);
    expect(msg.ack).toHaveBeenCalled();
})

it('does not call ack if the event has a skipped version number', async () => {
    const { listener, data, msg } = await setup();
    data.version = 100;
    try {
        await listener.onMessage(data, msg);
    } catch (error) {
        expect(error).toBeDefined();
    }
    expect(msg.ack).not.toHaveBeenCalled();
})