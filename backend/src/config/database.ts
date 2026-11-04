import { DATABASE_URL } from "./env.js";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: DATABASE_URL
});

pool.on("error", (error) => {
    console.error("Unexpected database error: ", error);
});

export default pool;