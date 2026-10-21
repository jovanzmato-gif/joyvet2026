<?php
require "common.php";

$stmt = $pdo->query(
    "SELECT p.name AS product,
            COALESCE(s.customer_name, st.full_name, 'Walk-in') AS customer,
            si.quantity AS qty,
            (si.price_at_sales * si.quantity) AS amount,
            DATE_FORMAT(s.sales_date, '%h:%i %p') AS time
     FROM sales_items si
     JOIN sales s ON s.sales_id = si.sales_id
     JOIN products p ON p.product_id = si.product_id
     LEFT JOIN staff st ON st.staff_id = s.staff_id
     ORDER BY s.sales_date DESC, si.sales_item_id DESC
     LIMIT 20"
);

$rows = $stmt->fetchAll();

json_out(array_map(function ($r) {
    return [
        "product"  => $r["product"],
        "customer" => $r["customer"],
        "qty"      => (int)$r["qty"],
        "amount"   => (float)$r["amount"],
        "time"     => $r["time"]
    ];
}, $rows));