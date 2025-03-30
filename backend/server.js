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

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
