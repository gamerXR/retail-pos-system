import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { posDB } from "./db";

export interface SetOpeningBalanceRequest {
  amount: number;
}

export interface OpeningBalanceResponse {
  success: boolean;
  amount: number;
}

// Sets the opening balance for the day.
export const setOpeningBalance = api<SetOpeningBalanceRequest, OpeningBalanceResponse>(
  { auth: true, expose: true, method: "POST", path: "/pos/opening-balance" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    await posDB.exec`
      INSERT INTO opening_balances (amount, client_id)
      VALUES (${req.amount}, ${auth.clientID})
    `;

    return {
      success: true,
      amount: req.amount
    };
  }
);

// Gets the latest opening balance.
export const getOpeningBalance = api<void, OpeningBalanceResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/opening-balance" },
  async () => {
    const auth = getAuthData()! as AuthData;
    const row = await posDB.queryRow<{ amount: number }>`
      SELECT amount FROM opening_balances
      WHERE client_id = ${auth.clientID}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return {
      success: true,
      amount: row?.amount || 0
    };
  }
);
