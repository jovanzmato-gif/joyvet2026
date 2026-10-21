<?php
require "common.php";

$user = require_staff($pdo);

$isOwner = $user["role"] === "Owner";

$sql = "SELECT a.attendence_id, a.staff_id, s.full_name, s.role, a.status,
               DATE_FORMAT(a.clock_in, '%d %b %Y, %h:%i %p') AS clock_in,
               DATE_FORMAT(a.clock_out, '%d %b %Y, %h:%i %p') AS clock_out,
               a.hours_worked
        FROM attendence a
        JOIN staff s ON s.staff_id = a.staff_id";

if ($isOwner) {
    $stmt = $pdo->query($sql . " ORDER BY a.clock_in DESC LIMIT 100");
} else {
    $stmt = $pdo->prepare($sql . " WHERE a.staff_id = ? ORDER BY a.clock_in DESC LIMIT 50");
    $stmt->execute([(int)$user["staff_id"]]);
}

$rows = array_map(function ($r) {
    return [
        "id"           => (int)$r["attendence_id"],
        "staff_id"     => (int)$r["staff_id"],
        "name"         => $r["full_name"],
        "role"         => $r["role"],
        "status"       => $r["status"],
        "clock_in"     => $r["clock_in"],
        "clock_out"    => $r["clock_out"] ?? "",
        "hours_worked" => $r["hours_worked"] !== null ? (float)$r["hours_worked"] : null
    ];
}, $stmt->fetchAll());

json_out([
    "isOwner" => $isOwner,
    "me"      => (int)$user["staff_id"],
    "records" => $rows
]);