<?php
ob_start();
require_once __DIR__ . "/db.php";

// Customers use their own session cookie, so they can never share a session with staff
session_name("JOYVET_CUSTOMER");
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