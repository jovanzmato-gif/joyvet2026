<?php
require "common.php";

$owner = require_staff($pdo);

if ($owner["role"] !== "Owner") {
    json_out(["success" => false, "message" => "Only the owner can create worker accounts."], 403);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

if (!password_verify((string)($_POST["password"] ?? ""), $owner["password_hash"] ?? "")) {
    json_out(["success" => false, "message" => "Incorrect owner password. No account was created."]);
}

$fullName       = trim($_POST["full_name"] ?? "");
$username       = trim($_POST["username"] ?? "");
$pin            = trim($_POST["pin"] ?? "");
$workerPassword = trim($_POST["worker_password"] ?? "");

if ($fullName === "" || $username === "" || $pin === "" || $workerPassword === "") {
    json_out(["success" => false, "message" => "Please complete all worker details."]);
}
if (!preg_match('/^[A-Za-z0-9._-]{3,50}$/', $username)) {
    json_out(["success" => false, "message" => "Username must be 3 to 50 letters, digits, dots, dashes or underscores."]);
}
if (!preg_match('/^\d{4,6}$/', $pin)) {
    json_out(["success" => false, "message" => "PIN must be 4 to 6 digits."]);
}
if (strlen($workerPassword) < 6) {
    json_out(["success" => false, "message" => "Password must be at least 6 characters."]);
}

$check = $pdo->prepare("SELECT staff_id FROM staff WHERE username = ?");
$check->execute([$username]);
if ($check->fetch()) {
    json_out(["success" => false, "message" => "That username is already taken."]);
}

$ins = $pdo->prepare(
    "INSERT INTO staff (full_name, role, username, pin_hash, password_hash)
     VALUES (?, 'Worker', ?, ?, ?)"
);
$ins->execute([
    $fullName,
    $username,
    password_hash($pin, PASSWORD_DEFAULT),
    password_hash($workerPassword, PASSWORD_DEFAULT)
]);

log_action($pdo, (int)$owner["staff_id"], "Worker created", $owner["full_name"] . " created " . $fullName . " as worker");

json_out(["success" => true, "message" => "Worker account created for " . $fullName . "."]);