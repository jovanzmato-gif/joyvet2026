<?php
require "common.php";

$user = require_staff($pdo);

if ($user["role"] !== "Owner") {
    json_out(["success" => false, "message" => "Only the owner can change suppliers."], 403);
}
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

if (!password_verify((string)($_POST["password"] ?? ""), $user["password_hash"] ?? "")) {
    json_out(["success" => false, "message" => "Incorrect password. No change was made."]);
}

$action = $_POST["action"] ?? "";
$id     = (int)($_POST["supplier_id"] ?? 0);
$name   = trim($_POST["name"] ?? "");
$phone  = trim($_POST["phone"] ?? "");
$supplies = trim($_POST["supplies"] ?? "");

if ($action === "delete") {
    if ($id < 1) {
        json_out(["success" => false, "message" => "Choose a supplier to delete."]);
    }
    $pdo->prepare("DELETE FROM suppliers WHERE supplier_id = ?")->execute([$id]);
    log_action($pdo, (int)$user["staff_id"], "Supplier deleted", $user["full_name"] . " deleted supplier #" . $id);
    json_out(["success" => true, "message" => "Supplier deleted."]);
}

if ($name === "") {
    json_out(["success" => false, "message" => "Enter the supplier's name."]);
}
if ($phone !== "" && !preg_match('/^[0-9+ ()-]{7,20}$/', $phone)) {
    json_out(["success" => false, "message" => "Enter a valid phone number."]);
}

$phoneValue    = $phone !== "" ? $phone : null;
$suppliesValue = $supplies !== "" ? $supplies : null;

if ($action === "add") {
    $pdo->prepare("INSERT INTO suppliers (name, contact_phone, supplies) VALUES (?, ?, ?)")
        ->execute([$name, $phoneValue, $suppliesValue]);
    log_action($pdo, (int)$user["staff_id"], "Supplier added", $user["full_name"] . " added supplier " . $name);
    json_out(["success" => true, "message" => "Supplier " . $name . " added."]);
}

if ($action === "edit") {
    if ($id < 1) {
        json_out(["success" => false, "message" => "Choose a supplier to edit."]);
    }
    $pdo->prepare("UPDATE suppliers SET name = ?, contact_phone = ?, supplies = ? WHERE supplier_id = ?")
        ->execute([$name, $phoneValue, $suppliesValue, $id]);
    log_action($pdo, (int)$user["staff_id"], "Supplier edited", $user["full_name"] . " edited supplier " . $name);
    json_out(["success" => true, "message" => "Supplier " . $name . " updated."]);
}

json_out(["success" => false, "message" => "Unknown action."], 400);