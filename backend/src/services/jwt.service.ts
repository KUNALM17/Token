import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: number;
  phone: string;
  role: string;
  hospitalId?: number;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload as object, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRY || '7d') as string,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;
  } catch (error) {
    return null;
  }
};
