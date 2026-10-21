<?php
require "common.php";

$user = require_staff($pdo);

$stmt = $pdo->query("SELECT supplier_id, name, contact_phone, supplies FROM suppliers ORDER BY name");

$rows = array_map(function ($r) {
    return [
        "id"      => (int)$r["supplier_id"],
        "name"    => $r["name"],
        "phone"   => $r["contact_phone"] ?? "",
        "supplies" => $r["supplies"] ?? ""
    ];
}, $stmt->fetchAll());

json_out([
    "isOwner"   => $user["role"] === "Owner",
    "suppliers" => $rows
]);