<?php
require "common.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$username = trim($_POST["username"] ?? "");
$pin      = trim($_POST["pin"] ?? "");

if ($username === "" || $pin === "") {
    json_out(["success" => false, "message" => "Enter your username and PIN."]);
}

$stmt = $pdo->prepare("SELECT staff_id, full_name, role, pin_hash FROM staff WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($pin, $user["pin_hash"])) {
    json_out(["success" => false, "message" => "Incorrect username or PIN."]);
}

session_regenerate_id(true);
$_SESSION["staff_id"] = (int)$user["staff_id"];

log_action($pdo, (int)$user["staff_id"], "Login", $user["full_name"] . " signed in");

json_out([
    "success" => true,
    "user" => [
        "id" => (int)$user["staff_id"],
        "fullName" => $user["full_name"],
        "role" => $user["role"]
    ]
]);