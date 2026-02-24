import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'test',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'test',
    });
  }
  return razorpayInstance;
};

export const razorpay = {
  orders: {
    create: async (params: any) => {
      return getRazorpay().orders.create(params);
    },
  },
};

interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
}

export const createOrder = async (params: CreateOrderParams) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(params.amount * 100), // Convert to paise
      currency: params.currency || 'INR',
      receipt: params.receipt || `receipt_${Date.now()}`,
    });
    return order;
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw error;
  }
};

export const verifyPayment = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  const crypto = require('crypto');
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};
