import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  phone: string;
  role: string;
  hospitalId?: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;
  } catch (error) {
    return null;
  }
};
