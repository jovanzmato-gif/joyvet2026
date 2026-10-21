<?php
require "customer_common.php";

if ((int)($_SESSION["customer_id"] ?? 0) < 1) {
    json_out(["success" => false, "message" => "Please sign in first."], 401);
}

$stmt = $pdo->query("SELECT product_id, name, category, price, stock, low_stock_threshold FROM products ORDER BY category, name");

$rows = array_map(function ($r) {
    $stock     = (int)$r["stock"];
    $threshold = (int)$r["low_stock_threshold"];

    // Customers see a limit, not the exact count
    $available = $stock <= 0 ? 0 : min($stock, 20);

    return [
        "id"        => (int)$r["product_id"],
        "name"      => $r["name"],
        "category"  => $r["category"] ?? "",
        "price"     => (float)$r["price"],
        "available" => $available,
        "status"    => $stock <= 0 ? "out" : ($stock < $threshold ? "limited" : "in")
    ];
}, $stmt->fetchAll());

json_out($rows);