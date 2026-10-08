import { useEffect, useState } from "react";
import StripeCheckoutModule from "react-stripe-checkout";
const StripeCheckout = StripeCheckoutModule.default ?? StripeCheckoutModule;
import useRequest from "../../hooks/use-request";
import Router from "next/router";

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const { doRequest, errors } = useRequest({
    url: "/api/payments",
    method: "post",
    body: {
      orderId: order.id,
    },
    onSuccess: (payment) => Router.push("/orders"),
  });

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };
    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);
    return () => clearInterval(timerId);
  }, [order.expiresAt]);

  if (timeLeft <= 0) {
    return <div>Order expired</div>;
  }

  return (
    <div>
      <h1>Order Page</h1>
      <p>Time left to pay: {timeLeft} seconds</p>
      
      <StripeCheckout
        token={({id}) => doRequest({ token: id })}
        stripeKey="pk_test_51UJHSKKnEzVZvJlXbbf3gFpkzGMxaiWGx4754AzmP1chdNAlo8FWy8b3d1ycNY9dvUnfEwI6TGtW92JiBa1ZKCnk00DwLt9c5b"
        amount={order.ticket.price * 100}
        currency="usd"
        email={currentUser.email}
      />
      {errors}
    </div>
  );
};
OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);
  return { order: data };
};

export default OrderShow;
