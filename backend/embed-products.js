import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
  ssl: { rejectUnauthorized: false },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedder = genAI.getGenerativeModel({ model: "embedding-001" });

async function run() {
  const { rows: products } = await pool.query(`
    SELECT 
      p.id,
      CONCAT(
        p.name, 
        '. Type: ', p.product_type,
        '. ', p.calories, ' kcal.',
        ' Allergens: ',
        COALESCE(string_agg(a.name, ', ' ORDER BY a.name), 'None')
      ) AS summary
    FROM product p
    LEFT JOIN product_allergens pa ON pa.product_id = p.id
    LEFT JOIN allergens a ON a.id = pa.allergen_id
    GROUP BY p.id, p.name, p.product_type, p.calories
  `);

  for (const { id, summary } of products) {
    const result = await embedder.embedContent(summary);
    const embedding = result.embedding.values;

    await pool.query(`UPDATE product SET embedding = $1 WHERE id = $2`, [
      embedding,
      id,
    ]);

    console.log(`Embedded: ${id} - ${summary}`);
  }

  await pool.end();
}

run();
