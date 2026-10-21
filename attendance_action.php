<?php
require "common.php";

$user = require_staff($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$action  = $_POST["action"] ?? "";
$staffId = (int)$user["staff_id"];

if ($action === "clock_in") {
    $open = $pdo->prepare("SELECT attendence_id FROM attendence WHERE staff_id = ? AND status = 'active' LIMIT 1");
    $open->execute([$staffId]);
    if ($open->fetch()) {
        json_out(["success" => false, "message" => "You are already clocked in."]);
    }

    $pdo->prepare("INSERT INTO attendence (staff_id, clock_in, status) VALUES (?, NOW(), 'active')")
        ->execute([$staffId]);

    log_action($pdo, $staffId, "Clocked in", $user["full_name"] . " clocked in");
    json_out(["success" => true, "message" => "Clocked in at " . date("h:i A") . "."]);
}

if ($action === "clock_out") {
    // Hours are calculated by the database clock, so both timestamps use the same time zone
    $open = $pdo->prepare(
        "SELECT attendence_id, ROUND(TIMESTAMPDIFF(SECOND, clock_in, NOW()) / 3600, 2) AS hours
         FROM attendence
         WHERE staff_id = ? AND status = 'active'
         ORDER BY clock_in DESC LIMIT 1"
    );
    $open->execute([$staffId]);
    $row = $open->fetch();

    if (!$row) {
        json_out(["success" => false, "message" => "You are not clocked in."]);
    }

    $hours = (float)$row["hours"];

    $pdo->prepare("UPDATE attendence SET clock_out = NOW(), hours_worked = ?, status = 'done' WHERE attendence_id = ?")
        ->execute([$hours, (int)$row["attendence_id"]]);

    log_action($pdo, $staffId, "Clocked out", $user["full_name"] . " clocked out after " . number_format($hours, 2) . " hours");
    json_out(["success" => true, "message" => "Clocked out. Hours worked: " . number_format($hours, 2) . "."]);
}

json_out(["success" => false, "message" => "Unknown action."], 400);
