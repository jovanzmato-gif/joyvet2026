<?php
require "common.php";

$user = require_staff($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$customer = trim($_POST["customer_name"] ?? "");
$phone    = trim($_POST["phone"] ?? "");
$method   = $_POST["method"] ?? "pickup";
$address  = trim($_POST["address"] ?? "");
$note     = trim($_POST["staff_note"] ?? "");
$items    = json_decode($_POST["items"] ?? "[]", true);

if ($customer === "" || $phone === "") {
    json_out(["success" => false, "message" => "Customer name and phone number are required."]);
}
if (!in_array($method, ["pickup", "delivery"], true)) {
    json_out(["success" => false, "message" => "Choose pickup or delivery."]);
}
if ($method === "delivery" && $address === "") {
    json_out(["success" => false, "message" => "Enter a delivery address."]);
}
if (!is_array($items) || count($items) === 0) {
    json_out(["success" => false, "message" => "Add at least one item to the order."]);
}

// Check every line before touching the database
$lines = [];
foreach ($items as $item) {
    $qty     = (int)($item["quantity"] ?? 0);
    $isChick = !empty($item["is_chick_order"]);
    $pid     = (isset($item["product_id"]) && $item["product_id"] !== "") ? (int)$item["product_id"] : null;
    $name    = trim($item["item_name"] ?? "");
    $breed   = trim($item["breed"] ?? "");
    $needed  = trim($item["needed_by"] ?? "");

    if ($qty < 1) {
        json_out(["success" => false, "message" => "Each item needs a quantity of at least 1."]);
    }
    if ($needed !== "" && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $needed)) {
        json_out(["success" => false, "message" => "The needed-by date is not valid."]);
    }

    if ($isChick) {
        if ($name === "") {
            json_out(["success" => false, "message" => "Enter the name of each chick or other item."]);
        }
        $pid = null;
    } elseif ($pid === null || $pid < 1) {
        json_out(["success" => false, "message" => "Choose a product for each product line."]);
    }

    $lines[] = [
        "product_id"     => $pid,
        "item_name"      => $name,
        "quantity"       => $qty,
        "is_chick_order" => $isChick ? 1 : 0,
        "breed"          => $breed !== "" ? $breed : null,
        "needed_by"      => $needed !== "" ? $needed : null
    ];
}

$address = $address !== "" ? $address : null;
$note    = $note !== "" ? $note : null;

try {
    $pdo->beginTransaction();

    // Check and reserve stock for product lines
    foreach ($lines as $i => $line) {
        if ($line["is_chick_order"] === 1) {
            continue;
        }

        $stmt = $pdo->prepare("SELECT name, stock FROM products WHERE product_id = ? FOR UPDATE");
        $stmt->execute([$line["product_id"]]);
        $p = $stmt->fetch();

        if (!$p) {
            $pdo->rollBack();
            json_out(["success" => false, "message" => "A product on this order was not found."]);
        }
        if ((int)$p["stock"] < $line["quantity"]) {
            $pdo->rollBack();
            json_out(["success" => false, "message" => "Not enough stock for " . $p["name"] . ". Available: " . $p["stock"] . "."]);
        }

        $pdo->prepare("UPDATE products SET stock = stock - ? WHERE product_id = ?")
            ->execute([$line["quantity"], $line["product_id"]]);

        $lines[$i]["item_name"] = $p["name"];
    }

    $orderId = "ORD" . date("ymdHis") . str_pad((string)random_int(0, 99), 2, "0", STR_PAD_LEFT);

    $pdo->prepare(
        "INSERT INTO orders (order_id, customer_name, phone, method, address, status, staff_note)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)"
    )->execute([$orderId, $customer, $phone, $method, $address, $note]);

    $itemIns = $pdo->prepare(
        "INSERT INTO order_items (order_id, product_id, item_name, quantity, is_chick_order, breed, needed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    foreach ($lines as $line) {
        $itemIns->execute([
            $orderId,
            $line["product_id"],
            $line["item_name"],
            $line["quantity"],
            $line["is_chick_order"],
            $line["breed"],
            $line["needed_by"]
        ]);
    }

    log_action(
        $pdo,
        (int)$user["staff_id"],
        "Order placed",
        $user["full_name"] . " placed order " . $orderId . " (" . count($lines) . " item line(s))"
    );

    $pdo->commit();

    json_out(["success" => true, "message" => "Order " . $orderId . " saved as pending."]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_out(["success" => false, "message" => "The order could not be saved. Please try again."], 500);
}