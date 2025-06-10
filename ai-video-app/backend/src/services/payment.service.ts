import Stripe from 'stripe';
import { query, transaction } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateCheckoutParams {
  userId: string;
  planType: 'standard' | 'premium';
  successUrl: string;
  cancelUrl: string;
}

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(params: CreateCheckoutParams) {
    const { userId, planType, successUrl, cancelUrl } = params;

    // Get user
    const userResult = await query(
      'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new ApiError(404, 'ユーザーが見つかりません');
    }

    const user = userResult.rows[0];

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      await query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );
    }

    // Get price ID based on plan
    const priceId = planType === 'premium' 
      ? process.env.STRIPE_PREMIUM_PRICE_ID 
      : process.env.STRIPE_STANDARD_PRICE_ID;

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planType,
      },
    });

    return session;
  }

  async handleWebhook(body: any, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    return event;
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const { userId, planType } = session.metadata!;

    await transaction(async (client) => {
      // Update user plan
      const planLimits: Record<string, number> = {
        standard: 20,
        premium: 15,
      };

      await client.query(
        `UPDATE users 
         SET plan_type = $1, usage_limit = $2, usage_count = 0
         WHERE id = $3`,
        [planType, planLimits[planType], userId]
      );

      // Record payment
      await client.query(
        `INSERT INTO payment_history 
         (user_id, stripe_payment_intent_id, stripe_subscription_id, 
          amount, plan_type, payment_status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          session.payment_intent,
          session.subscription,
          session.amount_total! / 100, // Convert from cents
          planType,
          'succeeded',
          JSON.stringify(session.metadata),
        ]
      );
    });

    logger.info(`Checkout completed for user ${userId}, plan: ${planType}`);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    logger.info(`Subscription updated: ${subscription.id}`);
    // Handle subscription updates (e.g., plan changes)
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by customer ID
    const userResult = await query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [customerId]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;

      // Downgrade to free plan
      await query(
        'UPDATE users SET plan_type = $1, usage_limit = 0 WHERE id = $2',
        ['free', userId]
      );

      logger.info(`Subscription cancelled for user ${userId}`);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    logger.info(`Invoice payment succeeded: ${invoice.id}`);
    // Record successful payments
  }

  async getPaymentHistory(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM payment_history WHERE user_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);

    const historyResult = await query(
      `SELECT * FROM payment_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      payments: historyResult.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getSubscriptionStatus(userId: string) {
    const userResult = await query(
      'SELECT plan_type, usage_count, usage_limit, stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new ApiError(404, 'ユーザーが見つかりません');
    }

    const user = userResult.rows[0];

    // If no Stripe customer, return basic info
    if (!user.stripe_customer_id || user.plan_type === 'free') {
      return {
        planType: user.plan_type,
        usageCount: user.usage_count,
        usageLimit: user.usage_limit,
        isActive: false,
      };
    }

    // Get subscription from Stripe
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        return {
          planType: user.plan_type,
          usageCount: user.usage_count,
          usageLimit: user.usage_limit,
          isActive: true,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
      }
    } catch (error) {
      logger.error('Error fetching Stripe subscription:', error);
    }

    return {
      planType: user.plan_type,
      usageCount: user.usage_count,
      usageLimit: user.usage_limit,
      isActive: false,
    };
  }

  async cancelSubscription(userId: string) {
    const userResult = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      throw new ApiError(404, 'サブスクリプションが見つかりません');
    }

    const customerId = userResult.rows[0].stripe_customer_id;

    // Get active subscription
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new ApiError(404, 'アクティブなサブスクリプションが見つかりません');
    }

    // Cancel at period end
    await this.stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });
  }
}