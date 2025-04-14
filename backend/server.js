import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pg from "pg";
const { Pool } = pg;

dotenv.config({ path: "./.env" });

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: { rejectUnauthorized: false },
});

process.on("SIGINT", () => {
    pool.end();
    console.log("Application successfully shutdown");
    process.exit(0);
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("../frontend/dist"));

const PORT = process.env.PORT || 8080;

app.get("/api/products", (req, res) => {
    pool.query("SELECT * from product;").then((query_res) => {
        res.json(query_res.rows);
    });
});

app.get("/api/employee", (req, res) => {
    pool.query("SELECT * from employee;").then((query_res) => {
        res.json(query_res.rows);
    });
});

app.get("/api/products-by-category", (req, res) => {
    pool.query(
        "SELECT json_object_agg(product_type, product_info) AS product_data FROM (SELECT product_type, json_agg(json_build_object('id', id, 'name', name, 'price', price, 'inventory', inventory, 'product_type', product_type)) AS product_info FROM product GROUP BY product_type) AS subquery;"
    ).then((query_res) => {
        const data = query_res.rows[0].product_data;
        res.json(data);
    });
});

app.get("/api/x-report", async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Missing date parameter" });
    }

    try {
        const result = await pool.query(`
            SELECT 
                EXTRACT(HOUR FROM t.time) AS hour, 
                COUNT(DISTINCT t.id) AS total_orders, 
                SUM(ti.subtotal) AS total_sales,
                SUM(CASE WHEN t.payment_type = 'cash' THEN ti.subtotal ELSE 0 END) AS cash_sales,
                SUM(CASE WHEN t.payment_type = 'card' THEN ti.subtotal ELSE 0 END) AS card_sales,
                SUM(CASE WHEN t.payment_type = 'check' THEN ti.subtotal ELSE 0 END) AS check_sales,
                SUM(CASE WHEN t.payment_type = 'gift_card' THEN ti.subtotal ELSE 0 END) AS gift_card_sales,
                SUM(CASE WHEN t.transaction_type = 'return' THEN ti.subtotal ELSE 0 END) AS returns,
                SUM(CASE WHEN t.transaction_type = 'void' THEN ti.subtotal ELSE 0 END) AS voids,
                SUM(CASE WHEN t.transaction_type = 'discard' THEN ti.subtotal ELSE 0 END) AS discards
            FROM transaction t
            JOIN transaction_item ti ON t.id = ti.transaction_id
            WHERE DATE(t.time) = $1
            GROUP BY hour
            ORDER BY hour;
        `, [date]);

        // Convert cents to dollars and send result
        const formatted = result.rows.map(row => ({
            hour: row.hour,
            total_orders: row.total_orders,
            total_sales: row.total_sales / 100,
            cash_sales: row.cash_sales / 100,
            card_sales: row.card_sales / 100,
            check_sales: row.check_sales / 100,
            gift_card_sales: row.gift_card_sales / 100,
            returns: row.returns / 100,
            voids: row.voids / 100,
            discards: row.discards / 100,
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Error fetching X-Report:", error);
        res.status(500).json({ error: "Failed to fetch X-Report" });
    }
});

app.get("/api/z-report", async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Missing date parameter" });
    }

    try {
        const result = await pool.query(`
            SELECT 
                COUNT(DISTINCT t.id) AS total_transactions,
                SUM(ti.subtotal) AS total_sales,
                SUM(CASE WHEN t.payment_type = 'cash' THEN ti.subtotal ELSE 0 END) AS cash_total,
                SUM(CASE WHEN t.payment_type = 'card' THEN ti.subtotal ELSE 0 END) AS card_total,
                SUM(CASE WHEN t.transaction_type = 'return' THEN ti.subtotal ELSE 0 END) AS returns_total,
                SUM(CASE WHEN t.transaction_type = 'void' THEN ti.subtotal ELSE 0 END) AS voids_total,
                SUM(CASE WHEN t.transaction_type = 'discard' THEN ti.subtotal ELSE 0 END) AS discards_total
            FROM transaction t
            JOIN transaction_item ti ON t.id = ti.transaction_id
            WHERE DATE(t.time) = $1
        `, [date]);

        const row = result.rows[0];

        const TAX_RATE = 8.25;
        const totalSales = row.total_sales / 100;
        const returns = row.returns_total / 100;
        const voids = row.voids_total / 100;
        const discards = row.discards_total / 100;
        const netRevenue = totalSales - returns - voids - discards;
        const salesTax = netRevenue * (TAX_RATE / 100);
        const totalWithTax = netRevenue + salesTax;

        res.json({
            date,
            totalTransactions: row.total_transactions,
            grossSales: totalSales,
            netRevenue,
            salesTax,
            totalWithTax,
            cash: row.cash_total / 100,
            card: row.card_total / 100,
            returns,
            voids,
            discards,
        });
    } catch (err) {
        console.error("Z-Report error:", err);
        res.status(500).json({ error: "Failed to fetch Z-Report" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
