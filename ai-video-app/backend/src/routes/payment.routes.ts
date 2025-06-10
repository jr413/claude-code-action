import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createCheckoutSchema } from '../validations/payment.validation';

const router = Router();
const paymentController = new PaymentController();

// Webhook doesn't require authentication
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authenticate);

router.post('/create-checkout-session', validate(createCheckoutSchema), paymentController.createCheckoutSession);
router.get('/history', paymentController.getPaymentHistory);
router.get('/subscription', paymentController.getSubscriptionStatus);
router.post('/cancel-subscription', paymentController.cancelSubscription);

export default router;