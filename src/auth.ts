import { sign } from "jsonwebtoken";

import { User } from "./entity/User";

export const createAccessToken = (user: User) => {
  return sign(
    { userId: user.id, userName: user.name, userEmail: user.email },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15m",
    }
  );
};

export const createRefreshToken = (user: User) => {
  return sign(
    {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      tokenVersion: user.tokenVersion,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "7d",
    }
  );
};
