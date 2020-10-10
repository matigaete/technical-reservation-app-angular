<?php
header('Access-Control-Allow-Origin: *'); 
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
$jsonFactura = json_decode(file_get_contents("php://input"));  
if (!$jsonFactura) {
    exit("No hay datos");
}
$bd = include_once "conexion.php";
 
$sentencia = $bd->prepare("CALL insert_fact_compra(?,?,?,?,?,?,?)");

$resultado = $sentencia->execute([
    $jsonFactura->_codFactura, $jsonFactura->_codPersona, $jsonFactura->_fecha,
    $jsonFactura->_hora, $jsonFactura->_neto, $jsonFactura->_iva, $jsonFactura->_total]);

echo json_encode([
    "resultado" => $resultado,
]);

?>