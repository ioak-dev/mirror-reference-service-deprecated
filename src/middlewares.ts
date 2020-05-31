import jwt from 'jsonwebtoken';
const jwtsecret = 'jwtsecret';

export const authorize = (token: string) => {
  try {
    if (token) {
      return jwt.verify(token, jwtsecret);
    }
    return null;
  } catch (err) {
    return null;
  }
};
