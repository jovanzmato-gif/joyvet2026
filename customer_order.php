<?php
require "customer_common.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$customerId = (int)($_SESSION["customer_id"] ?? 0);
if ($customerId < 1) {
    json_out(["success" => false, "message" => "Please sign in to place an order."], 401);
}

$cust = $pdo->prepare("SELECT full_name, phone FROM customers WHERE customer_id = ?");
$cust->execute([$customerId]);
$customer = $cust->fetch();
if (!$customer) {
    json_out(["success" => false, "message" => "Please sign in to place an order."], 401);
}

$method  = $_POST["method"] ?? "pickup";
$address = trim($_POST["address"] ?? "");
$note    = trim($_POST["note"] ?? "");
$items   = json_decode($_POST["items"] ?? "[]", true);

if (!in_array($method, ["pickup", "delivery"], true)) {
    json_out(["success" => false, "message" => "Choose pickup or delivery."]);
}
if ($method === "delivery" && $address === "") {
    json_out(["success" => false, "message" => "Enter a delivery address."]);
}
if (!is_array($items) || count($items) === 0) {
    json_out(["success" => false, "message" => "Add at least one item to your order."]);
}

// Combine repeated lines and check each quantity
$lines = [];
foreach ($items as $item) {
    $pid = (int)($item["product_id"] ?? 0);
    $qty = (int)($item["quantity"] ?? 0);
    if ($pid < 1 || $qty < 1) {
        json_out(["success" => false, "message" => "Each item needs a product and a quantity of at least 1."]);
    }
    $lines[$pid] = ($lines[$pid] ?? 0) + $qty;
}

try {
    $pdo->beginTransaction();

    $prepared = [];

    foreach ($lines as $pid => $qty) {
        $stmt = $pdo->prepare("SELECT name, stock FROM products WHERE product_id = ? FOR UPDATE");
        $stmt->execute([$pid]);
        $p = $stmt->fetch();

        if (!$p) {
            $pdo->rollBack();
            json_out(["success" => false, "message" => "One of the products is no longer available."]);
        }
        if ((int)$p["stock"] < $qty) {
            $pdo->rollBack();
            json_out(["success" => false, "message" => "Sorry, only " . $p["stock"] . " of " . $p["name"] . " are left."]);
        }

        $pdo->prepare("UPDATE products SET stock = stock - ? WHERE product_id = ?")
            ->execute([$qty, $pid]);

        $prepared[] = ["product_id" => $pid, "name" => $p["name"], "qty" => $qty];
    }

    $orderId = "ORD" . date("ymdHis") . str_pad((string)random_int(0, 99), 2, "0", STR_PAD_LEFT);

    $pdo->prepare(
        "INSERT INTO orders (order_id, customer_name, phone, method, address, status, staff_note)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)"
    )->execute([
        $orderId,
        $customer["full_name"],
        $customer["phone"],
        $method,
        $method === "delivery" ? $address : null,
        $note !== "" ? "Placed online: " . $note : "Placed online"
    ]);

    $itemIns = $pdo->prepare(
        "INSERT INTO order_items (order_id, product_id, item_name, quantity, is_chick_order, breed, needed_by)
         VALUES (?, ?, ?, ?, 0, NULL, NULL)"
    );
    foreach ($prepared as $line) {
        $itemIns->execute([$orderId, $line["product_id"], $line["name"], $line["qty"]]);
    }

    // Audit entry written directly, since customers have no staff ID
    $audit = $pdo->prepare("INSERT INTO audit_log (staff_id, action, details) VALUES (NULL, ?, ?)");
    $audit->execute([
        "Online order",
        $customer["full_name"] . " placed order " . $orderId . " (" . count($prepared) . " item line(s))"
    ]);

    $pdo->commit();

    json_out([
        "success" => true,
        "message" => "Your order " . $orderId . " has been received. We will contact you on " . $customer["phone"] . " when it is ready."
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_out(["success" => false, "message" => "Your order could not be saved. Please try again."], 500);
}