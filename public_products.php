<?php
require "common.php";

$stmt = $pdo->query(
    "SELECT name, category, price, stock, low_stock_threshold
     FROM products ORDER BY category, name"
);

$rows = array_map(function ($r) {
    $stock     = (int)$r["stock"];
    $threshold = (int)$r["low_stock_threshold"];

    if ($stock <= 0) {
        $availability = "out";
    } elseif ($stock < $threshold) {
        $availability = "limited";
    } else {
        $availability = "in";
    }

    return [
        "name"         => $r["name"],
        "category"     => $r["category"] ?? "",
        "price"        => (float)$r["price"],
        "availability" => $availability
    ];
}, $stmt->fetchAll());

json_out($rows);