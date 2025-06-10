import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { logger } from '../utils/logger';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planType, successUrl, cancelUrl } = req.body;
      const userId = req.user!.userId;

      const session = await this.paymentService.createCheckoutSession({
        userId,
        planType,
        successUrl: successUrl || `${process.env.FRONTEND_URL}/payment/success`,
        cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const event = await this.paymentService.handleWebhook(req.body, sig);

      logger.info(`Stripe webhook processed: ${event.type}`);

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;

      const history = await this.paymentService.getPaymentHistory(
        userId,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  getSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const subscription = await this.paymentService.getSubscriptionStatus(userId);

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      await this.paymentService.cancelSubscription(userId);

      res.json({
        success: true,
        message: 'サブスクリプションをキャンセルしました',
      });
    } catch (error) {
      next(error);
    }
  };
}