import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

// Auth validations
export const validateSendOtp = validate([
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be 10 digits'),
]);

export const validateVerifyOtp = validate([
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be 10 digits'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
]);

// Hospital validations
export const validateCreateHospital = validate([
  body('name').notEmpty().withMessage('Hospital name required'),
  body('address').notEmpty().withMessage('Address required'),
  body('city').notEmpty().withMessage('City required'),
  body('state').notEmpty().withMessage('State required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid phone required'),
]);

// Doctor validations
export const validateCreateDoctor = validate([
  body('userId').notEmpty().withMessage('User ID required'),
  body('specialization').notEmpty().withMessage('Specialization required'),
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Valid fee required'),
  body('dailyTokenLimit')
    .isInt({ min: 1, max: 500 })
    .withMessage('Token limit between 1-500'),
]);

// Appointment validations
export const validateBookAppointment = validate([
  body('doctorId').notEmpty().withMessage('Doctor ID required'),
  body('hospitalId').notEmpty().withMessage('Hospital ID required'),
  body('appointmentDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date format: YYYY-MM-DD'),
]);

export const validateDateQuery = validate([
  query('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date format: YYYY-MM-DD'),
]);
