const axios = require("axios");
const ONEAUTH_API = process.env.ONEAUTH_API || "http://localhost:4010/api";
import { userSchema, userCollection } from "./model";
const { getCollection } = require("../../lib/dbutils");

export const decodeAccessToken = async (space: number, accessToken: string) => {
  let decodedResponse = null;
  try {
    decodedResponse = await axios.get(`${ONEAUTH_API}/auth/token/decode`, {
      headers: {
        authorization: accessToken,
      },
    });
  } catch (err) {
    if (err.response.status === 401) {
      return "expired";
    }
  }

  if (decodedResponse.status === 200) {
    const model = getCollection(space, userCollection, userSchema);
    const data = await model.findByIdAndUpdate(
      decodedResponse.data.user_id,
      {
        ...decodedResponse.data,
        resolver: "oneauth_space",
      },
      { new: true, upsert: true }
    );
    return decodedResponse.data || null;
  }

  return null;
};

export const getNewAccessToken = async (
  space: number,
  refreshToken: string
) => {
  const refreshTokenResponse = await axios.post(`${ONEAUTH_API}/auth/token`, {
    grant_type: "refresh_token",
    realm: space,
    refresh_token: refreshToken,
  });

  if (refreshTokenResponse.status === 200) {
    return refreshTokenResponse.data;
  }

  return null;
};
