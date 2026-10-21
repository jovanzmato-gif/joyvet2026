<?php
require "customer_common.php";

$customerId = (int)($_SESSION["customer_id"] ?? 0);
if ($customerId < 1) {
    json_out(["success" => false, "message" => "Please sign in first."], 401);
}

$cust = $pdo->prepare("SELECT phone FROM customers WHERE customer_id = ?");
$cust->execute([$customerId]);
$customer = $cust->fetch();
if (!$customer) {
    json_out(["success" => false, "message" => "Please sign in first."], 401);
}

// Only this customer's orders, matched by their phone number
$stmt = $pdo->prepare(
    "SELECT order_id, placed_at, method, status
     FROM orders
     WHERE phone = ?
     ORDER BY placed_at DESC
     LIMIT 50"
);
$stmt->execute([$customer["phone"]]);
$orders = $stmt->fetchAll();

$itemStmt = $pdo->prepare("SELECT quantity, item_name FROM order_items WHERE order_id = ?");

$labels = [
    "pending"     => "Received, being prepared",
    "confirmed"   => "Confirmed, we will contact you",
    "unavailable" => "Not available at the moment, please call us",
    "fulfilled"   => "Ready or collected. Thank you!"
];

$rows = [];
foreach ($orders as $o) {
    $itemStmt->execute([$o["order_id"]]);
    $parts = [];
    foreach ($itemStmt->fetchAll() as $i) {
        $parts[] = (int)$i["quantity"] . " × " . $i["item_name"];
    }

    $rows[] = [
        "order_id"    => $o["order_id"],
        "placed_at"   => date("d M Y, h:i A", strtotime($o["placed_at"])),
        "method"      => $o["method"] === "delivery" ? "Delivery" : "Pickup",
        "items"       => implode(", ", $parts),
        "status"      => $o["status"],
        "status_text" => $labels[$o["status"]] ?? $o["status"]
    ];
}

json_out($rows);