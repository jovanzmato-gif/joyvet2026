<?php
require "common.php";

require_staff($pdo);

// Customers who placed orders (they have a phone number)
$orders = $pdo->query(
    "SELECT customer_name, MAX(phone) AS phone, COUNT(*) AS orders_count, MAX(placed_at) AS last_activity
     FROM orders
     GROUP BY customer_name"
)->fetchAll();

// Customers typed in at the POS (name only)
$sales = $pdo->query(
    "SELECT customer_name AS name, COUNT(*) AS sales_count,
            COALESCE(SUM(total_amount), 0) AS total, MAX(sales_date) AS last_activity
     FROM sales
     WHERE customer_name IS NOT NULL AND customer_name <> '' AND customer_name <> 'Walk-in'
     GROUP BY customer_name"
)->fetchAll();

$people = [];

foreach ($orders as $o) {
    $key = strtolower(trim($o["customer_name"]));
    $people[$key] = [
        "name"          => $o["customer_name"],
        "phone"         => $o["phone"] ?? "",
        "orders"        => (int)$o["orders_count"],
        "sales"         => 0,
        "total"         => 0.0,
        "last_activity" => $o["last_activity"]
    ];
}

foreach ($sales as $s) {
    $key = strtolower(trim($s["name"]));
    if (!isset($people[$key])) {
        $people[$key] = [
            "name"          => $s["name"],
            "phone"         => "",
            "orders"        => 0,
            "sales"         => 0,
            "total"         => 0.0,
            "last_activity" => null
        ];
    }
    $people[$key]["sales"] += (int)$s["sales_count"];
    $people[$key]["total"] += (float)$s["total"];

    $last = $people[$key]["last_activity"];
    if ($last === null || $s["last_activity"] > $last) {
        $people[$key]["last_activity"] = $s["last_activity"];
    }
}

$list = array_values($people);
usort($list, fn($a, $b) => strcasecmp($a["name"], $b["name"]));

$rows = array_map(function ($p) {
    return [
        "name"     => $p["name"],
        "phone"    => $p["phone"],
        "orders"   => $p["orders"],
        "sales"    => $p["sales"],
        "total"    => round($p["total"], 2),
        "last"     => $p["last_activity"] ? date("d M Y", strtotime($p["last_activity"])) : "—"
    ];
}, $list);

json_out($rows);