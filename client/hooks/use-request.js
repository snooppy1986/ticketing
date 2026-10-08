import axios from "axios";
import { useState } from "react";

export default ({ url, method, body, onSuccess }) => {
  const [errors, setErrors] = useState([]);

  const doRequest = async (props={}) => {
    try {
      setErrors(null);
      const response = await axios[method](url, {...body, ...props});
      onSuccess && onSuccess(response.data);
      return response.data;
    } catch (error) {
      const messages = error.response?.data?.errors ?? [
        {
          message:
            error.response?.data?.message ||
            error.message ||
            "Something went wrong",
        },
      ];
      setErrors(
        <>
          {messages.map((err) => (
            <div className="alert alert-danger" role="alert" key={err.message}>
              {err.message}
            </div>
          ))}
        </>,
      );
    }
  };

  return { doRequest, errors };
};
