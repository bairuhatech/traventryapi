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

let getMatchingData = (resp) => {
  let invoices = [];
  let receipts = [];
  let matchedInvoices = [];
  let nonMatchedInvoices = [];
  let receiptsIndexArr = [];
  let invoiceIndexArr = [];
  for (let index = 0; index < resp.length; index++) {
    let trObj = resp[index];

    if (trObj["tr_type"] === "RD") {
      if (receiptsIndexArr.indexOf(trObj["tr_code"]) < 0) {
        receiptsIndexArr.push(trObj["tr_code"]);
        receipts.push({ tr_code: trObj["tr_code"], data: [trObj] });
      } else {
        // find the receipts index from receipts with tr_code
        let indexOfObjInReceiptsArr = receipts
          .map((obj) => {
            return obj["tr_code"];
          })
          .indexOf(trObj["tr_code"]);
        // then push the data to that array
        receipts[indexOfObjInReceiptsArr]["data"].push(trObj);
      }
    } else if (trObj["tr_type"] === "AS") {
      if (invoiceIndexArr.indexOf(trObj["tr_code"]) < 0) {
        invoiceIndexArr.push(trObj["tr_code"]);
        invoices.push({ tr_code: trObj["tr_code"], data: [trObj] });
      } else {
        // find the invoices index from invoices with tr_code
        let indexOfObjInInvoicesrr = invoices
          .map((obj) => {
            return obj["tr_code"];
          })
          .indexOf(trObj["tr_code"]);
        // then push the data to that array
        invoices[indexOfObjInInvoicesrr]["data"].push(trObj);
      }
    }
  }

  for (
    let indexInvoices = 0;
    indexInvoices < invoices.length;
    indexInvoices++
  ) {
    let invoiceObj = invoices[indexInvoices];
    let invoiceTotalValue = 0;
    let invoiceMatchedValue = 0;
    let currentInvoice;
    invoiceObj["data"].forEach((invoice) => {
      currentInvoice = invoice;
      invoiceTotalValue = parseFloat(invoice["tr_net"]);
      invoiceMatchedValue =
        parseFloat(invoiceMatchedValue) + parseFloat(invoice["txnm_amount"]);
    });
    if (invoiceTotalValue <= invoiceMatchedValue) {
      matchedInvoices.push(currentInvoice);
    } else {
      nonMatchedInvoices.push(currentInvoice);
    }
  }

  // console.log("invoices", invoices);
  // console.log("receipts", receipts);
  // console.log("matchedInvoices", matchedInvoices);
  // console.log("nonMatchedInvoices", nonMatchedInvoices);
  return {
    invoices: invoices,
    receipts: receipts,
    matchedInvoices: matchedInvoices,
    nonMatchedInvoices: nonMatchedInvoices,
  };
};

app.get("/api/transactions-by-parent-acl-code/:parent_acl_code", (req, res) => {
  try {
    // let sqlQuery = `SELECT * FROM transaction WHERE tr_code IN ('RC-IT-22M151036','AS-IT-22M151025','AS-IT-22M151024','AS-IT-22M151023')`;

    let sqlQuery = `select tx.tr_code, tx.tr_type,tx.tr_prnt_acl_code, tx.tr_date,tx.tr_net,tx.status as txstatus,
    txmeta.tr_code as txmtrcode,txmeta.trm_name,txmeta.trm_tkt, txmeta.trm_naration,txmeta.trm_ser_type,txmeta.status as txmstatus,
    txcrdr.tr_code as txcrdrtrcode, txcrdr.acl_code,txcrdr.trcd_amt,txcrdr.status as txcrdrstatus,
    acclgr.acl_code as acclgraclcode,acclgr.acl_name,
    txm.*
    from transaction tx 
    left join txn_matching txm on tx.tr_code= txm.txnm_l_tr_code 
    inner join transaction_meta txmeta on tx.tr_code = txmeta.tr_code 
    inner join transaction_cr_dr txcrdr on tx.tr_code = txcrdr.tr_code and acl_code = '${req.params.parent_acl_code}'
    inner join account_ledger acclgr on acclgr.acl_code = txcrdr.acl_code
    WHERE tx.tr_code IN (SELECT tr_code FROM transaction WHERE tr_prnt_acl_code = '${req.params.parent_acl_code}' )`;

    let query = conn.query(sqlQuery, (err, results) => {
      if (err) throw err;
      let resultObj = {
        invoices: [],
        reciepts: [],
        matchedInvoices: [],
        nonMatchedInvoices: [],
      };
      res.send(apiResponse(getMatchingData(results)));
    });
  } catch (error) {
    res.send(apiResponse(error));
  }
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
  // return JSON.stringify({ status: 200, error: null, response: results });
  return { status: 200, error: null, response: results };
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
