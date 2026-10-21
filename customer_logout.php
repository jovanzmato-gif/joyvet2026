<?php
require "customer_common.php";

unset($_SESSION["customer_id"]);
json_out(["success" => true]);