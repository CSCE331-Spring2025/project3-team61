import { Client } from "pg";

const client = new Client({
    user: process.env.DB_User,
    host: process.env.DB_Host,
    database: process.env.Database,
    password: process.env.DB_Password,
    port: process.env.DB_Port,
});

client.connect();
module.exports = { client };
