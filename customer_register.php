<?php
require "customer_common.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$name     = trim($_POST["full_name"] ?? "");
$phone    = preg_replace('/\s+/', '', trim($_POST["phone"] ?? ""));
$password = (string)($_POST["password"] ?? "");

if (mb_strlen($name) < 2) {
    json_out(["success" => false, "message" => "Enter your full name."]);
}
if (!preg_match('/^\+?[0-9]{9,15}$/', $phone)) {
    json_out(["success" => false, "message" => "Enter a valid phone number (digits only, with or without +)."]);
}
if (strlen($password) < 6) {
    json_out(["success" => false, "message" => "Your password must be at least 6 characters."]);
}

$check = $pdo->prepare("SELECT customer_id FROM customers WHERE phone = ?");
$check->execute([$phone]);
if ($check->fetch()) {
    json_out(["success" => false, "message" => "An account with this phone number already exists. Please sign in instead."]);
}

$pdo->prepare("INSERT INTO customers (full_name, phone, password_hash) VALUES (?, ?, ?)")
    ->execute([$name, $phone, password_hash($password, PASSWORD_DEFAULT)]);

$id = (int)$pdo->lastInsertId();

// Customers get their own session key, so they can never be treated as staff
session_regenerate_id(true);
$_SESSION["customer_id"] = $id;

json_out(["success" => true, "message" => "Welcome, " . $name . "! Your account is ready.", "customer" => ["id" => $id, "fullName" => $name]]);