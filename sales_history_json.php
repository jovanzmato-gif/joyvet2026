<?php
require "common.php";
require_staff($pdo);

$stmt = $pdo->query(
    "SELECT s.sales_id,
            DATE_FORMAT(s.sales_date, '%d %b %Y, %h:%i %p') AS date,
            COALESCE(s.customer_name, st.full_name, 'Walk-in') AS customer,
            s.payment_method,
            s.total_amount AS total,
            GROUP_CONCAT(CONCAT(p.name, ' x', si.quantity) SEPARATOR ', ') AS items
     FROM sales s
     LEFT JOIN staff st ON st.staff_id = s.staff_id
     LEFT JOIN sales_items si ON si.sales_id = s.sales_id
     LEFT JOIN products p ON p.product_id = si.product_id
     GROUP BY s.sales_id
     ORDER BY s.sales_date DESC, s.sales_id DESC
     LIMIT 100"
);

$rows = $stmt->fetchAll();

json_out(array_map(function ($r) {
    return [
        "id"       => (int)$r["sales_id"],
        "date"     => $r["date"],
        "customer" => $r["customer"],
        "method"   => $r["payment_method"],
        "total"    => (float)$r["total"],
        "items"    => $r["items"] ?? ""
    ];
}, $rows));