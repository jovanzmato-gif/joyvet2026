<?php
require "common.php";

$user = current_staff($pdo);
if (!$user) {
    json_out(["success" => false, "message" => "Not signed in."], 401);
}

json_out([
    "success" => true,
    "user" => [
        "id" => (int)$user["staff_id"],
        "fullName" => $user["full_name"],
        "role" => $user["role"]
    ]
]);