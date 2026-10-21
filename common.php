<?php
ob_start();
require_once __DIR__ . "/db.php";
session_start();

function json_out($data, $code = 200) {
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($code);
    header("Content-Type: application/json");
    echo json_encode($data);
    exit;
}

set_exception_handler(function ($e) {
    json_out(["success" => false, "message" => "Server error. Please try again."], 500);
});

function current_staff($pdo) {
    if (empty($_SESSION["staff_id"])) {
        return null;
    }
    $stmt = $pdo->prepare("SELECT staff_id, full_name, role, password_hash FROM staff WHERE staff_id = ?");
    $stmt->execute([(int)$_SESSION["staff_id"]]);
    return $stmt->fetch() ?: null;
}

function require_staff($pdo) {
    $user = current_staff($pdo);
    if (!$user) {
        json_out(["success" => false, "message" => "Please sign in first."], 401);
    }
    return $user;
}

function log_action($pdo, $staffId, $action, $details) {
    $stmt = $pdo->prepare("INSERT INTO audit_log (staff_id, action, details) VALUES (?, ?, ?)");
    $stmt->execute([$staffId, $action, $details]);
}