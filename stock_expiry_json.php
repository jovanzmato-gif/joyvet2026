<?php
require "common.php";

require_staff($pdo);

$stmt = $pdo->query(
    "SELECT product_id, name, category, stock, low_stock_threshold, expiry_date,
            DATEDIFF(expiry_date, CURDATE()) AS days_left
     FROM products
     ORDER BY name"
);

$rows = array_map(function ($r) {
    $stock     = (int)$r["stock"];
    $threshold = (int)$r["low_stock_threshold"];
    $days      = $r["days_left"] === null ? null : (int)$r["days_left"];

    return [
        "product_id"     => (int)$r["product_id"],
        "name"           => $r["name"],
        "category"       => $r["category"],
        "stock"          => $stock,
        "threshold"      => $threshold,
        "expiry_date"    => $r["expiry_date"] ?? "",
        "days_left"      => $days,
        "low_stock"      => $stock < $threshold,
        "out_of_stock"   => $stock <= 0,
        "expired"        => $days !== null && $days < 0,
        "expiring_soon"  => $days !== null && $days >= 0 && $days <= 30
    ];
}, $stmt->fetchAll());

json_out($rows);