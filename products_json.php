<?php
require "db.php";

header("Content-Type: application/json");

$stmt = $pdo->query(
    "SELECT product_id, name, category, price, stock, low_stock_threshold, expiry_date
     FROM products ORDER BY name"
);
$rows = $stmt->fetchAll();

$products = array_map(function ($r) {
    return [
        "id"                => (int)$r["product_id"],
        "name"              => $r["name"],
        "category"          => $r["category"],
        "price"             => (float)$r["price"],
        "stock"             => (int)$r["stock"],
        "lowStockThreshold" => (int)$r["low_stock_threshold"],
        "expiryDate"        => $r["expiry_date"] ?? ""
    ];
}, $rows);

echo json_encode($products);