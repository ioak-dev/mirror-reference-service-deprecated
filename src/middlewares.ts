import fs from "fs";
import jwt from "jsonwebtoken";

export const authorize = (token: string) => {
  const parts = token.split(" ");
  if (parts.length !== 2) {
    return null;
  }
  return parts[1];
  // const appRoot = process.cwd();
  // const publicKey = fs.readFileSync(appRoot + "/public.pem");
  // try {
  //   if (token) {
  //     return jwt.verify(token, publicKey);
  //   }
  //   return null;
  // } catch (err) {
  //   return null;
  // }
};

export const authorizeApi = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.sendStatus(401);
    }
    const userId = authorize(token);
    if (!userId) {
      return res.sendStatus(401);
    }
    req.userId = userId;
    next();
  } catch (err) {
    return res.sendStatus(401);
  }
};
