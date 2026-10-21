<?php
require "customer_common.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$phone    = preg_replace('/\s+/', '', trim($_POST["phone"] ?? ""));
$password = (string)($_POST["password"] ?? "");

$stmt = $pdo->prepare("SELECT customer_id, full_name, password_hash FROM customers WHERE phone = ?");
$stmt->execute([$phone]);
$c = $stmt->fetch();

if (!$c || !password_verify($password, $c["password_hash"])) {
    json_out(["success" => false, "message" => "Incorrect phone number or password."]);
}

session_regenerate_id(true);
$_SESSION["customer_id"] = (int)$c["customer_id"];

json_out(["success" => true, "message" => "Welcome back, " . $c["full_name"] . ".", "customer" => ["id" => (int)$c["customer_id"], "fullName" => $c["full_name"]]]);