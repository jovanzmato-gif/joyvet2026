<?php
require "customer_common.php";

$id = (int)($_SESSION["customer_id"] ?? 0);

if ($id < 1) {
    json_out(["success" => false, "message" => "Not signed in."], 401);
}

$stmt = $pdo->prepare("SELECT customer_id, full_name, phone FROM customers WHERE customer_id = ?");
$stmt->execute([$id]);
$c = $stmt->fetch();

if (!$c) {
    json_out(["success" => false, "message" => "Not signed in."], 401);
}

json_out(["success" => true, "customer" => ["id" => (int)$c["customer_id"], "fullName" => $c["full_name"], "phone" => $c["phone"]]]);