<?php
require "common.php";

$user = require_staff($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$orderId   = trim($_POST["order_id"] ?? "");
$newStatus = $_POST["status"] ?? "";

if ($orderId === "" || !in_array($newStatus, ["confirmed", "unavailable", "fulfilled"], true)) {
    json_out(["success" => false, "message" => "Choose a valid status."]);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT order_id, customer_name, status FROM orders WHERE order_id = ? FOR UPDATE");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        json_out(["success" => false, "message" => "Order not found."]);
    }

    $current = $order["status"];

    if (in_array($current, ["fulfilled", "unavailable"], true)) {
        $pdo->rollBack();
        json_out(["success" => false, "message" => "This order is already " . $current . " and cannot change."]);
    }
    if ($newStatus === $current) {
        $pdo->rollBack();
        json_out(["success" => false, "message" => "The order is already " . $current . "."]);
    }

    $itemStmt = $pdo->prepare("SELECT product_id, quantity, is_chick_order FROM order_items WHERE order_id = ?");
    $itemStmt->execute([$orderId]);
    $lines = $itemStmt->fetchAll();

    $message = "Order " . $orderId . " marked " . $newStatus . ".";

    if ($newStatus === "unavailable") {
        // Return the stock that was reserved when the order was placed
        foreach ($lines as $l) {
            if ($l["product_id"] !== null && (int)$l["is_chick_order"] === 0) {
                $pdo->prepare("UPDATE products SET stock = stock + ? WHERE product_id = ?")
                    ->execute([(int)$l["quantity"], (int)$l["product_id"]]);
            }
        }
        $message = "Order " . $orderId . " marked unavailable. Reserved stock was returned.";
    }

    if ($newStatus === "fulfilled") {
        // Stock was already reserved when the order was placed, so only record the sale
        $saleLines = [];
        $total = 0;

        foreach ($lines as $l) {
            if ($l["product_id"] === null || (int)$l["is_chick_order"] === 1) {
                continue;
            }
            $pStmt = $pdo->prepare("SELECT price FROM products WHERE product_id = ?");
            $pStmt->execute([(int)$l["product_id"]]);
            $price = (float)$pStmt->fetchColumn();
            $qty   = (int)$l["quantity"];

            $total += $price * $qty;
            $saleLines[] = ["product_id" => (int)$l["product_id"], "qty" => $qty, "price" => $price];
        }

        if (count($saleLines) > 0) {
            $pdo->prepare(
                "INSERT INTO sales (staff_id, total_amount, payment_method, payment_detail, sales_date, customer_name)
                 VALUES (?, ?, 'cash', NULL, NOW(), ?)"
            )->execute([(int)$user["staff_id"], $total, $order["customer_name"]]);

            $saleId = (int)$pdo->lastInsertId();

            $saleItemIns = $pdo->prepare(
                "INSERT INTO sales_items (sales_id, product_id, quantity, price_at_sales) VALUES (?, ?, ?, ?)"
            );
            foreach ($saleLines as $s) {
                $saleItemIns->execute([$saleId, $s["product_id"], $s["qty"], $s["price"]]);
            }

            $message = "Order " . $orderId . " fulfilled. Sale #" . $saleId . " recorded for UGX " . number_format($total) . ".";
        } else {
            $message = "Order " . $orderId . " fulfilled. Chick or other non-stock items are not recorded as sales.";
        }
    }

    $pdo->prepare("UPDATE orders SET status = ? WHERE order_id = ?")->execute([$newStatus, $orderId]);

    log_action(
        $pdo,
        (int)$user["staff_id"],
        "Order " . $newStatus,
        $user["full_name"] . " marked order " . $orderId . " as " . $newStatus
    );

    $pdo->commit();

    json_out(["success" => true, "message" => $message]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_out(["success" => false, "message" => "The order could not be updated. Please try again."], 500);
}