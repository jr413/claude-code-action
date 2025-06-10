import { Router } from 'express';
import Stripe from 'stripe';
import { body, validationResult } from 'express-validator';
import { query, getClient } from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Price configuration
const PRICES = {
  standard: {
    monthly: 2980,
    annually: 29800, // 10 months price
  },
  premium: {
    monthly: 8980,
    annually: 89800, // 10 months price
  },
};

// Create checkout session
router.post(
  '/create-checkout-session',
  authenticateToken,
  [
    body('plan').isIn(['standard', 'premium']),
    body('interval').isIn(['monthly', 'annually']),
  ],
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { plan, interval } = req.body;
      const userId = req.user!.id;
      const userEmail = req.user!.email;

      // Check if user already has an active subscription
      const existingSub = await query(
        `SELECT * FROM subscriptions 
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      if (existingSub.rows.length > 0) {
        return res.status(400).json({ 
          error: 'You already have an active subscription' 
        });
      }

      // Create or retrieve Stripe customer
      let customerId: string;
      const customerResult = await query(
        'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 LIMIT 1',
        [userId]
      );

      if (customerResult.rows.length > 0 && customerResult.rows[0].stripe_customer_id) {
        customerId = customerResult.rows[0].stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId },
        });
        customerId = customer.id;
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
                description: `Video streaming ${plan} plan - ${interval} billing`,
              },
              unit_amount: PRICES[plan as keyof typeof PRICES][interval as 'monthly' | 'annually'],
              recurring: interval === 'monthly' ? { interval: 'month' } : { interval: 'year' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          userId,
          plan,
          interval,
        },
      });

      logger.info('Checkout session created', { 
        sessionId: session.id, 
        userId, 
        plan, 
        interval 
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
);

// Stripe webhook handler
router.post(
  '/webhook',
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const { client, release } = await getClient();

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const { userId, plan, interval } = session.metadata!;
          
          // Create subscription record
          await client.query(
            `INSERT INTO subscriptions 
             (user_id, plan_type, stripe_subscription_id, stripe_customer_id, 
              status, current_period_start, current_period_end)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '1 ${interval === 'monthly' ? 'month' : 'year'}')`,
            [userId, plan, session.subscription, session.customer, 'active']
          );

          // Update user plan
          await client.query(
            `UPDATE users 
             SET plan_type = $1, plan_expires_at = NOW() + INTERVAL '1 ${interval === 'monthly' ? 'month' : 'year'}'
             WHERE id = $2`,
            [plan, userId]
          );

          // Create payment record
          await client.query(
            `INSERT INTO payments 
             (user_id, stripe_payment_intent_id, amount_cents, currency, status, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              userId,
              session.payment_intent,
              session.amount_total,
              session.currency?.toUpperCase() || 'JPY',
              'completed',
              `${plan} plan - ${interval} subscription`,
            ]
          );

          logger.info('Subscription created from checkout', { userId, plan, interval });
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          
          await client.query(
            `UPDATE subscriptions 
             SET status = $1, current_period_end = to_timestamp($2),
                 cancel_at_period_end = $3, updated_at = NOW()
             WHERE stripe_subscription_id = $4`,
            [
              subscription.status,
              subscription.current_period_end,
              subscription.cancel_at_period_end,
              subscription.id,
            ]
          );

          logger.info('Subscription updated', { subscriptionId: subscription.id });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          
          // Update subscription status
          const subResult = await client.query(
            `UPDATE subscriptions 
             SET status = 'canceled', canceled_at = NOW()
             WHERE stripe_subscription_id = $1
             RETURNING user_id`,
            [subscription.id]
          );

          if (subResult.rows.length > 0) {
            // Revert user to free plan
            await client.query(
              `UPDATE users 
               SET plan_type = 'free', plan_expires_at = NULL
               WHERE id = $1`,
              [subResult.rows[0].user_id]
            );
          }

          logger.info('Subscription canceled', { subscriptionId: subscription.id });
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          
          if (invoice.subscription) {
            // Record payment
            const subResult = await client.query(
              'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
              [invoice.subscription]
            );

            if (subResult.rows.length > 0) {
              await client.query(
                `INSERT INTO payments 
                 (user_id, stripe_payment_intent_id, amount_cents, currency, status, description)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  subResult.rows[0].user_id,
                  invoice.payment_intent,
                  invoice.amount_paid,
                  invoice.currency?.toUpperCase() || 'JPY',
                  'completed',
                  'Subscription renewal',
                ]
              );
            }
          }
          
          logger.info('Payment succeeded', { invoiceId: invoice.id });
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          
          if (invoice.subscription) {
            const subResult = await client.query(
              'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
              [invoice.subscription]
            );

            if (subResult.rows.length > 0) {
              await client.query(
                `INSERT INTO payments 
                 (user_id, stripe_payment_intent_id, amount_cents, currency, status, description)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  subResult.rows[0].user_id,
                  invoice.payment_intent,
                  invoice.amount_due,
                  invoice.currency?.toUpperCase() || 'JPY',
                  'failed',
                  'Subscription renewal failed',
                ]
              );
            }
          }
          
          logger.warn('Payment failed', { invoiceId: invoice.id });
          break;
        }

        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing error:', error);
      res.status(500).send('Webhook processing failed');
    } finally {
      release();
    }
  }
);

// Get user subscription status
router.get('/subscription', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await query(
      `SELECT s.*, u.plan_type, u.plan_expires_at
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    res.json({
      plan_type: user.plan_type,
      plan_expires_at: user.plan_expires_at,
      subscription: user.stripe_subscription_id ? {
        id: user.id,
        status: user.status,
        current_period_end: user.current_period_end,
        cancel_at_period_end: user.cancel_at_period_end,
      } : null,
    });
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Cancel subscription
router.post(
  '/cancel-subscription',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get active subscription
      const result = await query(
        'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      const subscriptionId = result.rows[0].stripe_subscription_id;

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local record
      await query(
        'UPDATE subscriptions SET cancel_at_period_end = true WHERE stripe_subscription_id = $1',
        [subscriptionId]
      );

      logger.info('Subscription cancellation scheduled', { userId, subscriptionId });
      res.json({ message: 'Subscription will be canceled at the end of the billing period' });
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }
);

// Get payment history
router.get('/payments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await query(
      `SELECT * FROM payments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      payments: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;