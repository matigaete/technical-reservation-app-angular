<?php
header("Access-Control-Allow-Origin: http://localhost:80");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: *");
if ($_SERVER["REQUEST_METHOD"] != "PUT") {
    exit("Solo acepto peticiones PUT");
}
$jsonProducto = json_decode(file_get_contents("php://input"));
if (!$jsonProducto) {
    exit("No hay datos");
}
$bd = include_once "conexion.php";
$sentencia = $bd->prepare("CALL baja_producto(?)");
$resultado = $sentencia->execute([$jsonProducto->_codigo]);
    
echo json_encode($resultado);

?>