// src/components/StripeCheckout.jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentsAPI } from '../api/payments';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const CheckoutForm = ({ orderId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [email, setEmail] = useState('');
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    // Create PaymentIntent on component mount
    if (orderId) {
      initializePayment();
    }
  }, [orderId]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.createPayment({
        order_id: orderId,
        receipt_email: email || undefined,
      });

      setClientSecret(response.data.client_secret);
      setPaymentIntentId(response.data.payment_intent_id);
      toast.success('Payment form initialized');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initialize payment');
      setCardError(error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setCardError('');

    try {
      // Confirm the payment with the card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              email: email,
            },
          },
        }
      );

      if (error) {
        setCardError(error.message);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (
        paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'processing'
      ) {
        // Confirm payment with backend
        const confirmResponse = await paymentsAPI.verifyStripe({
          payment_intent_id: paymentIntentId,
        });

        toast.success('Payment successful!');
        onSuccess(confirmResponse.data);
      }
    } catch (error) {
      setCardError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
          onChange={handleCardChange}
        />
        {cardError && (
          <div className="text-danger mt-2">{cardError}</div>
        )}
      </div>

      <div className="test-cards-info mt-3 mb-3 p-3 bg-light rounded">
        <p className="mb-2">
          <strong>Test Cards:</strong>
        </p>
        <ul className="mb-0">
          <li>
            <code>4242 4242 4242 4242</code> - Success
          </li>
          <li>
            <code>4000 0000 0000 0002</code> - Decline
          </li>
          <li>
            <code>4000 0000 0000 9995</code> - 3D Secure
          </li>
          <li>Use any future date and any 3-digit CVC</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="btn btn-primary w-100"
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Processing...
          </>
        ) : (
          `Pay $${amount}`
        )}
      </button>
    </form>
  );
};

export const StripeCheckout = ({ orderId, amount, onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        orderId={orderId}
        amount={amount}
        onSuccess={onSuccess}
      />
    </Elements>
  );
};

export default StripeCheckout;