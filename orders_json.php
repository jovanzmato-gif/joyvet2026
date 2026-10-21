<?php
require "common.php";

require_staff($pdo);

$stmt = $pdo->query(
    "SELECT o.order_id,
            DATE_FORMAT(o.placed_at, '%d %b %Y, %h:%i %p') AS placed,
            o.customer_name,
            o.phone,
            o.method,
            COALESCE(o.address, '') AS address,
            o.status,
            COALESCE(o.staff_note, '') AS staff_note,
            COALESCE(GROUP_CONCAT(CONCAT(oi.quantity, ' × ', oi.item_name) SEPARATOR ', '), '') AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     GROUP BY o.order_id, o.placed_at, o.customer_name, o.phone, o.method, o.address, o.status, o.staff_note
     ORDER BY o.placed_at DESC
     LIMIT 100"
);

$rows = array_map(function ($r) {
    return [
        "order_id"      => $r["order_id"],
        "placed_at"     => $r["placed"],
        "customer_name" => $r["customer_name"],
        "phone"         => $r["phone"],
        "method"        => $r["method"],
        "address"       => $r["address"],
        "status"        => $r["status"],
        "staff_note"    => $r["staff_note"],
        "items"         => $r["items"]
    ];
}, $stmt->fetchAll());

json_out($rows);