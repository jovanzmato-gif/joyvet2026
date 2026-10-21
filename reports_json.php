<?php
require "common.php";

$user = require_staff($pdo);

if ($user["role"] !== "Owner") {
    json_out(["success" => false, "message" => "Reports are for the owner only."], 403);
}

$from = $_GET["from"] ?? date("Y-m-01");
$to   = $_GET["to"] ?? date("Y-m-d");

foreach ([$from, $to] as $d) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) || !strtotime($d)) {
        json_out(["success" => false, "message" => "Choose valid dates."]);
    }
}
if ($from > $to) {
    json_out(["success" => false, "message" => "The start date must be before the end date."]);
}

$range = [$from, $to];

// Sales totals
$s = $pdo->prepare("SELECT COUNT(*) AS sale_count, COALESCE(SUM(total_amount), 0) AS total
                    FROM sales WHERE DATE(sales_date) BETWEEN ? AND ?");
$s->execute($range);
$summary = $s->fetch();

// Sales by payment method
$p = $pdo->prepare("SELECT payment_method, COUNT(*) AS cnt, COALESCE(SUM(total_amount), 0) AS total
                    FROM sales WHERE DATE(sales_date) BETWEEN ? AND ?
                    GROUP BY payment_method");
$p->execute($range);
$payments = $p->fetchAll();

// Top products by value
$t = $pdo->prepare(
    "SELECT p.name, SUM(si.quantity) AS qty, SUM(si.quantity * si.price_at_sales) AS amount
     FROM sales_items si
     JOIN sales s ON s.sales_id = si.sales_id
     JOIN products p ON p.product_id = si.product_id
     WHERE DATE(s.sales_date) BETWEEN ? AND ?
     GROUP BY p.product_id, p.name
     ORDER BY amount DESC LIMIT 10"
);
$t->execute($range);
$top = $t->fetchAll();

// Stock position (current, not date-based)
$stock = $pdo->query(
    "SELECT COUNT(*) AS items,
            COALESCE(SUM(price * stock), 0) AS value,
            COALESCE(SUM(stock < low_stock_threshold), 0) AS low,
            COALESCE(SUM(stock <= 0), 0) AS out_of_stock,
            COALESCE(SUM(expiry_date IS NOT NULL AND expiry_date < CURDATE()), 0) AS expired,
            COALESCE(SUM(expiry_date IS NOT NULL AND expiry_date >= CURDATE()
                         AND expiry_date <= CURDATE() + INTERVAL 30 DAY), 0) AS expiring
     FROM products"
)->fetch();

// Completed shifts per staff member
$h = $pdo->prepare(
    "SELECT st.full_name, COUNT(a.attendence_id) AS shifts, COALESCE(SUM(a.hours_worked), 0) AS hours
     FROM staff st
     LEFT JOIN attendence a ON a.staff_id = st.staff_id
          AND a.status = 'done' AND DATE(a.clock_in) BETWEEN ? AND ?
     GROUP BY st.staff_id, st.full_name
     ORDER BY st.full_name"
);
$h->execute($range);
$hours = $h->fetchAll();

// Orders by status
$o = $pdo->prepare("SELECT status, COUNT(*) AS cnt FROM orders
                    WHERE DATE(placed_at) BETWEEN ? AND ? GROUP BY status");
$o->execute($range);
$orders = $o->fetchAll();

json_out([
    "success" => true,
    "from"    => $from,
    "to"      => $to,
    "summary" => [
        "sale_count" => (int)$summary["sale_count"],
        "total"      => (float)$summary["total"]
    ],
    "payments" => array_map(fn($r) => [
        "method" => $r["payment_method"],
        "count"  => (int)$r["cnt"],
        "total"  => (float)$r["total"]
    ], $payments),
    "top" => array_map(fn($r) => [
        "name"   => $r["name"],
        "qty"    => (int)$r["qty"],
        "amount" => (float)$r["amount"]
    ], $top),
    "stock" => [
        "items"        => (int)$stock["items"],
        "value"        => (float)$stock["value"],
        "low"          => (int)$stock["low"],
        "out_of_stock" => (int)$stock["out_of_stock"],
        "expired"      => (int)$stock["expired"],
        "expiring"     => (int)$stock["expiring"]
    ],
    "hours" => array_map(fn($r) => [
        "name"   => $r["full_name"],
        "shifts" => (int)$r["shifts"],
        "hours"  => (float)$r["hours"]
    ], $hours),
    "orders" => array_map(fn($r) => [
        "status" => $r["status"],
        "count"  => (int)$r["cnt"]
    ], $orders)
]);