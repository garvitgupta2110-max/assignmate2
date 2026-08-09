import jwt from "jsonwebtoken";

export const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret";
  const token = jwt.sign({ userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRY || "7d",
  } as any);
  return token;
};

export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret";
  return jwt.verify(token, secret);
};
