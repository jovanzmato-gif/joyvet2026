<?php
require "common.php";

$user = require_staff($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$items    = json_decode($_POST["items"] ?? "[]", true);
$customer = trim($_POST["customer_name"] ?? "");
$method   = $_POST["payment_method"] ?? "cash";
$detail   = trim($_POST["payment_detail"] ?? "");

if (!in_array($method, ["cash", "mtn", "airtel", "credit"], true)) {
    json_out(["success" => false, "message" => "Choose a valid payment method."]);
}
if (!is_array($items) || count($items) === 0) {
    json_out(["success" => false, "message" => "Add at least one product to the sale."]);
}

if ($customer === "") {
    $customer = "Walk-in";
}
if ($detail === "") {
    $detail = null;
}

// Combine repeated lines for the same product
$lines = [];
foreach ($items as $item) {
    $pid = (int)($item["product_id"] ?? 0);
    $qty = (int)($item["qty"] ?? 0);
    if ($pid < 1 || $qty < 1) {
        json_out(["success" => false, "message" => "Each item needs a product and a quantity of at least 1."]);
    }
    $lines[$pid] = ($lines[$pid] ?? 0) + $qty;
}

$pdo->beginTransaction();

try {
    $total    = 0;
    $prepared = [];

    foreach ($lines as $pid => $qty) {
        $stmt = $pdo->prepare("SELECT product_id, name, price, stock FROM products WHERE product_id = ? FOR UPDATE");
        $stmt->execute([$pid]);
        $p = $stmt->fetch();

        if (!$p) {
            $pdo->rollBack();
            json_out(["success" => false, "message" => "A product in this sale was not found."]);
        }
        if ((int)$p["stock"] < $qty) {
            $pdo->rollBack();
            json_out(["success" => false, "message" => "Not enough stock for " . $p["name"] . ". Available: " . $p["stock"] . "."]);
        }

        $price  = (float)$p["price"];
        $total += $price * $qty;
        $prepared[] = ["id" => $pid, "qty" => $qty, "price" => $price, "name" => $p["name"]];
    }

    $ins = $pdo->prepare(
        "INSERT INTO sales (staff_id, total_amount, payment_method, payment_detail, sales_date, customer_name)
         VALUES (?, ?, ?, ?, NOW(), ?)"
    );
    $ins->execute([(int)$user["staff_id"], $total, $method, $detail, $customer]);
    $saleId = (int)$pdo->lastInsertId();

    $itemIns  = $pdo->prepare("INSERT INTO sales_items (sales_id, product_id, quantity, price_at_sales) VALUES (?, ?, ?, ?)");
    $stockUpd = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE product_id = ?");

    foreach ($prepared as $line) {
        $itemIns->execute([$saleId, $line["id"], $line["qty"], $line["price"]]);
        $stockUpd->execute([$line["qty"], $line["id"]]);
    }

    log_action(
        $pdo,
        (int)$user["staff_id"],
        "Sale recorded",
        $user["full_name"] . " sold " . count($prepared) . " product(s) to " . $customer . " for UGX " . number_format($total)
    );

    $pdo->commit();

    json_out([
        "success" => true,
        "message" => "Sale saved. Receipt #" . $saleId . ", total UGX " . number_format($total) . ".",
        "sale_id" => $saleId
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_out(["success" => false, "message" => "The sale could not be saved. Please try again."], 500);
}