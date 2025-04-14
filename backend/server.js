import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-google-oauth20";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

passport.use(
    new Strategy(
        {
            clientID: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (_, __, profile, done) => {
            const email = profile._json.email;
            try {
                const queryRes = await pool.query(
                    "SELECT name, admin FROM employee WHERE email = $1;",
                    [email],
                );

                if (queryRes.rows.length === 0) {
                    return done(null, false, {
                        message: "Email not authorized",
                    });
                }

                return done(null, profile);
            } catch (err) {
                return done(err);
            }
        },
    ),
);

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

const PORT = process.env.PORT || 8080;

app.use(express.static("../frontend/dist"));

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/unauthorized",
        failureMessage: true,
    }),
    (_, res) => {
        res.redirect("/employee-nav");
    },
);

app.get("/api/products", (_, res) => {
    pool.query("SELECT * from product;").then((query_res) => {
        res.json(query_res.rows);
    });
});

app.put("/api/products/:id/inventory", async (req, res) => {
    const productId = req.params.id;
    const { inventory } = req.body;

    try {
        await pool.query("UPDATE product SET inventory = $1 WHERE id = $2", [
            inventory,
            productId,
        ]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error occured updating inventory:", err);
        res.status(500).json({
            success: false,
            message: "Failure to update inventory :(",
        });
    }
});

app.put("/api/products/:id/price", async (req, res) => {
    const productId = req.params.id;
    const { price } = req.body;

    if (typeof price !== "number" || price < 0) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid Price " });
    }
    const result = await pool.query(
        "UPDATE product SET price = $1 WHERE id = $2 RETURNING *",
        [price, productId],
    );

    res.status(200).json({ success: true, product: result.rows[0] });
});

app.post("/api/products", async (req, res) => {
    const { name, product_type, inventory, price } = req.body;

    if (!name || !product_type || inventory === undefined) {
        return res.status(400).json({ error: "Missing required info" });
    }

    const newProduct = await db.products.create({
        data: {
            name,
            product_type,
            inventory,
            price,
        },
    });

    res.status(201).json(newProduct);
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
        return res
            .status(400)
            .json({ success: false, message: "Invalid name or admin status" });
    }

    const result = await pool.query(
        "INSERT INTO employee (name, admin) VALUES ($1, $2) RETURNING *",
        [name, admin],
    );

    res.status(201).json({ success: true, employee: result.rows[0] });
});

//change admin stauts
app.put("/api/employee/:id", async (req, res) => {
    const { id } = req.params;
    const { admin } = req.body;

    if (typeof admin !== "boolean") {
        return res
            .status(400)
            .json({ success: false, message: "Invalid admid type" });
    }

    await pool.query("UPDATE employee SET admin = $1 WHERE id = $2", [
        admin,
        id,
    ]);
    res.status(200).json({ success: true });
});

// delete emplyee
app.delete("/api/employee/:id", async (req, res) => {
    const employeeId = req.params.id;

    const result = await pool.query(
        "DELETE FROM employee WHERE id = $1 RETURNING *",
        [employeeId],
    );

    if (result.rowCount === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Employee does not exist" });
    }

    res.status(200).json({ success: true });
});

app.get("/api/products-by-category", (req, res) => {
    pool.query(
        "SELECT json_object_agg(product_type, product_info) AS product_data FROM (SELECT product_type, json_agg(json_build_object('id', id, 'name', name, 'price', price, 'inventory', inventory, 'product_type', product_type)) AS product_info FROM product GROUP BY product_type) AS subquery;"
        // "SELECT json_object_agg(product_type, names) AS product_data FROM ( SELECT product_type, json_agg(name) AS names FROM product GROUP BY product_type) AS subquery;",
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
        const result = await pool.query(
            `
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
        `,
            [date],
        );

        // Convert cents to dollars and send result
        const formatted = result.rows.map((row) => ({
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
        const result = await pool.query(
            `
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
        `,
            [date],
        );

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

app.get("/api/sales-report", async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: "Missing start or end date" });
    }

    try {
        const result = await pool.query(
            `
        SELECT 
          p.name AS menu_item, 
          p.product_type AS category,
          COUNT(DISTINCT t.id) AS total_orders, 
          SUM(ti.subtotal) AS total_sales
        FROM product p
        JOIN transaction_item ti ON p.id = ti.product_id
        JOIN transaction t ON t.id = ti.transaction_id
        WHERE t.time BETWEEN $1 AND $2
        GROUP BY p.name, p.product_type
        ORDER BY p.name;
      `,
            [start, end],
        );

        const formatted = result.rows.map((row) => ({
            menu_item: row.menu_item,
            category: row.category,
            total_orders: parseInt(row.total_orders),
            total_sales: parseFloat(row.total_sales) / 100,
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Sales Report Error:", err);
        res.status(500).json({ error: "Failed to fetch sales report" });
    }
});

// Product Usage API endpoints

// Main endpoint for aggregated product usage data
app.get("/api/product-usage", async (req, res) => {
    const { startDate, endDate, startHour, endHour } = req.query;

    // Backward compatibility for old frontend
    const date = req.query.date;
    const start = req.query.start || startHour;
    const end = req.query.end || endHour;

    // Validate required parameters
    if ((!startDate && !date) || start == null || end == null) {
        return res.status(400).json({
            error: "Missing required parameters. Please provide date range and time range.",
        });
    }

    try {
        // Use date range if provided, otherwise fall back to single date
        const useRangeQuery = startDate && endDate;

        const query = useRangeQuery
            ? `
            SELECT 
              product.name AS product_name,
              COUNT(transaction_item.product_id) AS transaction_count,
              SUM(transaction_item.quantity) AS total_quantity,
              SUM(transaction_item.subtotal) AS total_revenue
            FROM transaction_item
            JOIN transaction ON transaction_item.transaction_id = transaction.id
            JOIN product ON product.id = transaction_item.product_id
            WHERE DATE(transaction.time) BETWEEN $1 AND $2
              AND EXTRACT(HOUR FROM transaction.time) BETWEEN $3 AND $4
            GROUP BY product.name
            ORDER BY transaction_count DESC;
          `
            : `
            SELECT 
              product.name AS product_name,
              COUNT(transaction_item.product_id) AS transaction_count,
              SUM(transaction_item.quantity) AS total_quantity,
              SUM(transaction_item.subtotal) AS total_revenue
            FROM transaction_item
            JOIN transaction ON transaction_item.transaction_id = transaction.id
            JOIN product ON product.id = transaction_item.product_id
            WHERE DATE(transaction.time) = $1
              AND EXTRACT(HOUR FROM transaction.time) BETWEEN $2 AND $3
            GROUP BY product.name
            ORDER BY transaction_count DESC;
          `;

        const params = useRangeQuery
            ? [startDate, endDate, start, end]
            : [date, start, end];

        const result = await pool.query(query, params);

        const formatted = result.rows.map((row) => ({
            product_name: row.product_name,
            count: parseInt(row.transaction_count),
            quantity: parseInt(row.total_quantity || 0),
            revenue: parseFloat(row.total_revenue || 0),
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Error fetching product usage:", err);
        res.status(500).json({
            error: "Failed to fetch product usage data",
            details: err.message,
        });
    }
});

// Time series data endpoint for charts
app.get("/api/product-usage/timeseries", async (req, res) => {
    const { startDate, endDate, startHour, endHour } = req.query;

    if (!startDate || !endDate || startHour == null || endHour == null) {
        return res.status(400).json({
            error: "Missing required parameters for time series data",
        });
    }

    try {
        // Get top 5 products first to include in time series
        const topProductsQuery = `
            SELECT 
              product.name AS product_name,
              COUNT(transaction_item.product_id) AS transaction_count
            FROM transaction_item
            JOIN transaction ON transaction_item.transaction_id = transaction.id
            JOIN product ON product.id = transaction_item.product_id
            WHERE DATE(transaction.time) BETWEEN $1 AND $2
              AND EXTRACT(HOUR FROM transaction.time) BETWEEN $3 AND $4
            GROUP BY product.name
            ORDER BY transaction_count DESC
            LIMIT 5;
        `;

        const topProductsResult = await pool.query(topProductsQuery, [
            startDate,
            endDate,
            startHour,
            endHour,
        ]);

        const topProducts = topProductsResult.rows.map(
            (row) => row.product_name,
        );

        // If we're looking at a single day, return hourly data
        // Otherwise return daily data
        const isSingleDay = startDate === endDate;

        let query;
        let params;

        if (isSingleDay) {
            // Hours as X-axis for single day view
            query = `
                SELECT 
                  EXTRACT(HOUR FROM transaction.time) AS hour,
                  product.name AS product_name,
                  COUNT(transaction_item.product_id) AS count
                FROM transaction_item
                JOIN transaction ON transaction_item.transaction_id = transaction.id
                JOIN product ON product.id = transaction_item.product_id
                WHERE DATE(transaction.time) = $1
                  AND EXTRACT(HOUR FROM transaction.time) BETWEEN $2 AND $3
                  AND product.name = ANY($4)
                GROUP BY hour, product.name
                ORDER BY hour;
            `;
            params = [startDate, startHour, endHour, topProducts];
        } else {
            // Days as X-axis for multi-day view
            query = `
                SELECT 
                  DATE(transaction.time) AS day,
                  product.name AS product_name,
                  COUNT(transaction_item.product_id) AS count
                FROM transaction_item
                JOIN transaction ON transaction_item.transaction_id = transaction.id
                JOIN product ON product.id = transaction_item.product_id
                WHERE DATE(transaction.time) BETWEEN $1 AND $2
                  AND EXTRACT(HOUR FROM transaction.time) BETWEEN $3 AND $4
                  AND product.name = ANY($5)
                GROUP BY day, product.name
                ORDER BY day;
            `;
            params = [startDate, endDate, startHour, endHour, topProducts];
        }

        const result = await pool.query(query, params);

        // Transform the data into the format needed for the chart
        const timeSeriesMap = new Map();

        // Initialize the data structure
        if (isSingleDay) {
            // Create entries for each hour in the range
            for (
                let hour = parseInt(startHour);
                hour <= parseInt(endHour);
                hour++
            ) {
                timeSeriesMap.set(hour, { hour });
            }

            // Fill in the actual data
            result.rows.forEach((row) => {
                const hour = parseInt(row.hour);
                const productName = row.product_name;
                const count = parseInt(row.count);

                const hourData = timeSeriesMap.get(hour) || { hour };
                hourData[productName] = count;
                timeSeriesMap.set(hour, hourData);
            });
        } else {
            // We need to process daily data
            result.rows.forEach((row) => {
                const day = row.day.toISOString().split("T")[0]; // Format as YYYY-MM-DD
                const productName = row.product_name;
                const count = parseInt(row.count);

                const dayData = timeSeriesMap.get(day) || { day };
                dayData[productName] = count;
                timeSeriesMap.set(day, dayData);
            });
        }

        // Convert map to array
        const timeSeriesData = Array.from(timeSeriesMap.values());

        res.json(timeSeriesData);
    } catch (err) {
        console.error("Error fetching time series data:", err);
        res.status(500).json({
            error: "Failed to fetch time series data",
            details: err.message,
        });
    }
});

// Summary statistics endpoint
app.get("/api/product-usage/summary", async (req, res) => {
    const { startDate, endDate, startHour, endHour } = req.query;

    if (!startDate || !endDate || startHour == null || endHour == null) {
        return res.status(400).json({
            error: "Missing required parameters for summary data",
        });
    }

    try {
        const query = `
            SELECT 
              COUNT(DISTINCT transaction.id) AS total_transactions,
              COUNT(DISTINCT product.id) AS unique_products,
              SUM(transaction_item.quantity) AS total_items_sold,
              SUM(transaction_item.subtotal) AS total_revenue
              AVG(transaction_item.subtotal) AS avg_transaction_value
            FROM transaction_item
            JOIN transaction ON transaction_item.transaction_id = transaction.id
            JOIN product ON product.id = transaction_item.product_id
            WHERE DATE(transaction.time) BETWEEN $1 AND $2
              AND EXTRACT(HOUR FROM transaction.time) BETWEEN $3 AND $4;
        `;

        const result = await pool.query(query, [
            startDate,
            endDate,
            startHour,
            endHour,
        ]);

        if (result.rows.length === 0) {
            return res.json({
                total_transactions: 0,
                unique_products: 0,
                total_items_sold: 0,
                total_revenue: 0,
                avg_transaction_value: 0,
            });
        }

        const summary = {
            total_transactions: parseInt(result.rows[0].total_transactions),
            unique_products: parseInt(result.rows[0].unique_products),
            total_items_sold: parseInt(result.rows[0].total_items_sold),
            total_revenue: parseFloat(result.rows[0].total_revenue),
            avg_transaction_value: parseFloat(
                result.rows[0].avg_transaction_value,
            ),
        };

        res.json(summary);
    } catch (err) {
        console.error("Error fetching summary data:", err);
        res.status(500).json({
            error: "Failed to fetch summary data",
            details: err.message,
        });
    }
});

// Category breakdown endpoint
app.get("/api/product-usage/categories", async (req, res) => {
    const { startDate, endDate, startHour, endHour } = req.query;

    if (!startDate || !endDate || startHour == null || endHour == null) {
        return res.status(400).json({
            error: "Missing required parameters for category data",
        });
    }

    try {
        const query = `
        SELECT 
          product.product_type AS category_name,
          COUNT(transaction_item.product_id) AS transaction_count,
          SUM(transaction_item.quantity) AS total_quantity,
          SUM(transaction_item.subtotal) AS total_revenue
        FROM transaction_item
        JOIN transaction ON transaction_item.transaction_id = transaction.id
        JOIN product ON product.id = transaction_item.product_id
        WHERE DATE(transaction.time) BETWEEN $1 AND $2
          AND EXTRACT(HOUR FROM transaction.time) BETWEEN $3 AND $4
        GROUP BY product.product_type
        ORDER BY transaction_count DESC;
      `;

        const result = await pool.query(query, [
            startDate,
            endDate,
            startHour,
            endHour,
        ]);

        const formatted = result.rows.map((row) => ({
            category_name: row.category_name,
            count: parseInt(row.transaction_count),
            quantity: parseInt(row.total_quantity || 0),
            revenue: parseFloat(row.total_revenue || 0),
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Error fetching category data:", err);
        res.status(500).json({
            error: "Failed to fetch category data",
            details: err.message,
        });
    }
});

app.get("/unauthorized", (req, res) => {
    res.send(req.session.message?.[0] || "Unauthorized");
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy();
        res.redirect("/");
    });
});

app.get("/login", (_, res) => {
    res.redirect("/");
});

app.get("/customer", (_, res) => {
    sendIndex(res);
});

app.get("menu-board", (_, res) => {
    sendIndex(res);
});

app.get("*", isAuthenticated, (_, res) => {
    sendIndex(res);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
}

function sendIndex(res) {
    res.sendFile(
        path.resolve(
            __dirname,
            path.join("..", "frontend", "dist", "index.html"),
        ),
    );
}
