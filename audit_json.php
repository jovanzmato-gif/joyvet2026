<?php
require "common.php";
require_staff($pdo);

$stmt = $pdo->query(
    "SELECT a.action, a.details, a.created_at AS time,
            COALESCE(s.full_name, 'System') AS actor,
            COALESCE(s.role, 'System') AS role
     FROM audit_log a
     LEFT JOIN staff s ON s.staff_id = a.staff_id
     ORDER BY a.audit_id DESC
     LIMIT 10"
);
json_out($stmt->fetchAll());