const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql2");

/*------------------------------------------
--------------------------------------------
parse application/json
--------------------------------------------
--------------------------------------------*/
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send(apiResponse({ data: "traventry api running version 1.0.0" }));
});

/*------------------------------------------
--------------------------------------------
Database Connection
--------------------------------------------
--------------------------------------------*/
const conn = mysql.createConnection({
  host: "139.59.6.251",
  user: "approot" /* MySQL User */,
  password: "Ibairuha_275DBz" /* MySQL Password */,
  database: "rylroot_" /* MySQL Database */,
});

/*------------------------------------------
--------------------------------------------
Shows Mysql Connect
--------------------------------------------
--------------------------------------------*/
conn.connect((err) => {
  if (err) throw err;
  console.log("Mysql Connected with App...");
});

/**
 * Get All Items
 *
 * @return response()
 */
app.get("/api/transactions", (req, res) => {
  let sqlQuery = "SELECT * FROM transaction LIMIT 1";

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Get Single Item
 *
 * @return response()
 */
app.get("/api/transactions/:tr_code", (req, res) => {
  let sqlQuery =
    "SELECT * FROM transaction WHERE tr_code=" + "'" + req.params.tr_code + "'";

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Get Multiple Transactions and matching data
 *
 * @return response()
 */
app.get("/api/multy-transactions/:trcodestring", (req, res) => {
  let data = { title: req.body.title, body: req.body.body };

  // let sqlQuery = `SELECT * FROM transaction WHERE tr_code IN ('RC-IT-22M151036','AS-IT-22M151025','AS-IT-22M151024','AS-IT-22M151023')`;
  let sqlQuery = `SELECT * FROM transaction WHERE tr_code IN (${req.params.trcodestring})`;

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});
/**
 * Get Multiple Transactions and matching data By parent acl code
 *
 * @return response()
 */
app.get("/api/transactions-by-parent-acl-code/:parent_acl_code", (req, res) => {
  // let sqlQuery = `SELECT * FROM transaction WHERE tr_code IN ('RC-IT-22M151036','AS-IT-22M151025','AS-IT-22M151024','AS-IT-22M151023')`;
  let sqlQuery = `SELECT * FROM transaction  tx
  LEFT  JOIN txn_matching txm
  ON tx.tr_code= txm.txnm_l_tr_code 
  WHERE tx.tr_code IN (SELECT tr_code FROM transaction WHERE tr_prnt_acl_code = '${req.params.parent_acl_code}' )`;

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Get All Matching Transations with
 *
 * @return response()
 */
app.get("/api/txn_matching/:tr_code", (req, res) => {
  // let sqlQuery =
  //   "SELECT * FROM transaction WHERE tr_code=" + "'" + req.params.tr_code + "'";

  let sqlQuery = `SELECT * FROM txn_matching WHERE txnm_r_tr_code = '${req.params.tr_code}'`;
  console.log(sqlQuery);
  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Create New Item
 *
 * @return response()
 */
app.post("/api/items", (req, res) => {
  let data = { title: req.body.title, body: req.body.body };

  let sqlQuery = "INSERT INTO items SET ?";

  let query = conn.query(sqlQuery, data, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Update Item
 *
 * @return response()
 */
app.put("/api/items/:id", (req, res) => {
  let sqlQuery =
    "UPDATE items SET title='" +
    req.body.title +
    "', body='" +
    req.body.body +
    "' WHERE id=" +
    req.params.id;

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Delete Item
 *
 * @return response()
 */
app.delete("/api/items/:id", (req, res) => {
  let sqlQuery = "DELETE FROM items WHERE id=" + req.params.id + "";

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * API Response
 *
 * @return response()
 */
function apiResponse(results) {
  return JSON.stringify({ status: 200, error: null, response: results });
}

/*------------------------------------------
--------------------------------------------
Server listening
--------------------------------------------
--------------------------------------------*/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port 3000...");
});
