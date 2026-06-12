import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireCsrf } from '../middleware/csrfMiddleware.js';
import {
  authActionLimiter,
  loginAccountLimiter,
  loginIpLimiter,
  tokenLimiter
} from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema
} from '../schemas/authSchemas.js';
import { emptySchema } from '../schemas/commonSchemas.js';

const router = Router();

router.post('/register', authActionLimiter, validate(registerSchema), register);
router.post('/login', loginIpLimiter, loginAccountLimiter, validate(loginSchema), login);
router.post('/refresh', tokenLimiter, requireCsrf, validate(emptySchema), refresh);
router.post('/logout', requireCsrf, validate(emptySchema), logout);
router.get('/me', protect, me);
router.post('/verify-email', tokenLimiter, validate(tokenSchema), verifyEmail);
router.post(
  '/resend-verification',
  authActionLimiter,
  validate(forgotPasswordSchema),
  resendVerification
);
router.post(
  '/forgot-password',
  authActionLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post('/reset-password', authActionLimiter, validate(resetPasswordSchema), resetPassword);
router.post(
  '/change-password',
  protect,
  requireCsrf,
  validate(changePasswordSchema),
  changePassword
);

export default router;
