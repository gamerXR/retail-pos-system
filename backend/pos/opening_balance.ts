import { api } from "encore.dev/api";
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
  { expose: true, method: "POST", path: "/pos/opening-balance" },
  async (req) => {
    await posDB.exec`
      INSERT INTO opening_balances (amount)
      VALUES (${req.amount})
    `;

    return {
      success: true,
      amount: req.amount
    };
  }
);

// Gets the latest opening balance.
export const getOpeningBalance = api<void, OpeningBalanceResponse>(
  { expose: true, method: "GET", path: "/pos/opening-balance" },
  async () => {
    const row = await posDB.queryRow<{ amount: number }>`
      SELECT amount FROM opening_balances
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return {
      success: true,
      amount: row?.amount || 0
    };
  }
);
