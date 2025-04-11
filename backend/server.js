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

app.put("/api/products/:id/inventory", async (req, res) => {
    const productId = req.params.id;
    const { inventory } = req.body;

    try {
        await pool.query(
            "UPDATE product SET inventory = $1 WHERE id = $2",
            [inventory, productId]
        );
        res.status(200).json({ success: true });

    } catch (err) {
        console.error("Error occured updating inventory:", err);
        res.status(500).json({ success: false, message: "Failure to update inventory :(" });
    }
});

app.put("/api/products/:id/price", async (req, res) => {
    const productId = req.params.id;
    const { price } = req.body;

    if (typeof price !== "number" || price < 0) {
        return res.status(400).json({ success: false, message: "Invalid Price " });
    }
        const result = await pool.query(
            "UPDATE product SET price = $1 WHERE id = $2 RETURNING *",
            [price, productId]
        );

        res.status(200).json({ success: true, product: result.rows[0] });
    
});

app.get("/api/employee", (req, res) => {
    pool.query("SELECT * from employee;").then((query_res) => {
        res.json(query_res.rows);
    });
});

// add employee
app.post("/api/employee", async (req, res) => {
    const { name, admin } = req.body;

    if (!name || typeof admin !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid name or admin status" });
    }

        const result = await pool.query(
            "INSERT INTO employee (name, admin) VALUES ($1, $2) RETURNING *",
            [name, admin]
        );

        res.status(201).json({ success: true, employee: result.rows[0] });

});

//change admin stauts
app.put("/api/employee/:id", async (req, res) => {
    const { id } = req.params;
    const { admin } = req.body;
  
    if (typeof admin !== "boolean") {
      return res.status(400).json({ success: false, message: "Invalid admid type" });
    }
  
      await pool.query("UPDATE employee SET admin = $1 WHERE id = $2", [admin, id]);
      res.status(200).json({ success: true });

  });

// delete emplyee
app.delete("/api/employee/:id", async (req, res) => {
    const employeeId = req.params.id;

        const result = await pool.query("DELETE FROM employee WHERE id = $1 RETURNING *", [employeeId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Employee does not exist" });
        }

        res.status(200).json({ success: true });

});

app.get("/api/products-by-category", (req, res) => {
    pool.query(
        "SELECT json_object_agg(product_type, names) AS product_data FROM ( SELECT product_type, json_agg(name) AS names FROM product GROUP BY product_type) AS subquery;"
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
