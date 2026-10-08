import { Ticket } from "../ticket";

it("implements optimistic concurrency control", async () => {
    const ticket = Ticket.build({
      title: "concert",
      price: 5,
      userId: "123",
    });
    await ticket.save();
  
    const firstInstance = await Ticket.findById(ticket._id);
    const secondInstance = await Ticket.findById(ticket._id);
  
    firstInstance!.set({ price: 10 });
    await firstInstance!.save();
  
    expect(firstInstance!.version).toEqual(1);
  
    try {
      await secondInstance!.save();
    } catch (err) {
      return;
    }
  
    throw new Error("Should not reach this point");
  });

  it("increments the version number on multiple saves", async () => {
    const ticket = Ticket.build({
      title: "concert",
      price: 5,
      userId: "123",
    });
    await ticket.save();
    expect(ticket.version).toEqual(0);
    await ticket.save();
    expect(ticket.version).toEqual(1);
    await ticket.save();
    expect(ticket.version).toEqual(2);
  });