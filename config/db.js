import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()
const dbConfig = {
    production: new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // needed for Render’s Postgres
    }),
    development: new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    })

}
// development
// export const pool = dbConfig.development

// Production
export const pool = dbConfig.production