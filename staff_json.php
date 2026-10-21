<?php
require "common.php";

$user = require_staff($pdo);

$stmt = $pdo->query(
    "SELECT s.staff_id, s.full_name, s.role, s.username,
            (SELECT DATE_FORMAT(a.clock_in, '%d %b %Y, %h:%i %p')
               FROM attendence a
              WHERE a.staff_id = s.staff_id AND a.status = 'active'
              ORDER BY a.clock_in DESC LIMIT 1) AS on_shift_since
     FROM staff s
     ORDER BY s.role, s.full_name"
);

$rows = array_map(function ($r) {
    return [
        "id"             => (int)$r["staff_id"],
        "name"           => $r["full_name"],
        "role"           => $r["role"],
        "username"       => $r["username"] ?? "",
        "on_shift_since" => $r["on_shift_since"]
    ];
}, $stmt->fetchAll());

json_out([
    "isOwner" => $user["role"] === "Owner",
    "staff"   => $rows
]);