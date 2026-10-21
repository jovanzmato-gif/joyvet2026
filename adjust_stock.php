<?php
require "common.php";

$user = require_staff($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$id       = (int)($_POST["product_id"] ?? 0);
$qty      = (int)($_POST["qty"] ?? 0);
$reason   = trim($_POST["reason"] ?? "");
$note     = trim($_POST["note"] ?? "");
$password = (string)($_POST["password"] ?? "");

if (!password_verify($password, $user["password_hash"] ?? "")) {
    json_out(["success" => false, "message" => "Incorrect password. Stock was not changed."]);
}

if ($id < 1 || $qty === 0) {
    json_out(["success" => false, "message" => "Select a product and enter a quantity other than zero."]);
}

$pdo->beginTransaction();

$stmt = $pdo->prepare("SELECT name, stock FROM products WHERE product_id = ? FOR UPDATE");
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product) {
    $pdo->rollBack();
    json_out(["success" => false, "message" => "Product not found."]);
}

$newStock = (int)$product["stock"] + $qty;
if ($newStock < 0) {
    $pdo->rollBack();
    json_out(["success" => false, "message" => "Stock cannot go below zero."]);
}

$upd = $pdo->prepare("UPDATE products SET stock = ? WHERE product_id = ?");
$upd->execute([$newStock, $id]);

$sign    = $qty > 0 ? "+" : "";
$summary = $sign . $qty . " " . $product["name"] . " (" . ($reason !== "" ? $reason : "No reason") . ")"
         . ($note !== "" ? " - " . $note : "");

log_action($pdo, (int)$user["staff_id"], "Stock adjusted", $user["full_name"] . " " . $summary);

$pdo->commit();

json_out([
    "success" => true,
    "message" => "Inventory updated: " . $summary . ". New stock: " . $newStock
]);