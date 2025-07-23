import { Router } from 'express';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create checkout session
router.post('/create-session', async (req, res) => {
  try {
    const { plan_type, user_id } = req.body;
    
    // Plan prices
    const prices: Record<string, number> = {
      standard: 2980,
      premium: 8980
    };
    
    if (!prices[plan_type]) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid plan type' 
      });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: `${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} Plan`,
            description: `AI Video Platform ${plan_type} subscription`,
          },
          unit_amount: prices[plan_type],
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        user_id,
        plan_type
      }
    });
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    logger.error('Error creating payment session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create payment session' 
    });
  }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Update user's plan in database
      logger.info('Payment successful for session:', session.id);
      break;
      
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

export default router;