import { SQLDatabase } from "encore.dev/storage/sqldb";

export const posDB = new SQLDatabase("pos", {
  migrations: "./migrations",
});
