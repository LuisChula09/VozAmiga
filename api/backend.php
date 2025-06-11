<?php

// TOKEN de acceso a Hugging Face (debe ser privado y generado desde tu cuenta)
$token = "hf_tuTokenAqui";  // ⚠️ Reemplaza con tu propio token de Hugging Face

// Nombre del modelo a usar desde Hugging Face Hub
$model = "HuggingFaceH4/zephyr-7b-beta";  // Puedes cambiarlo por otro modelo compatible

// Captura el mensaje del usuario desde el cuerpo del POST
$inputJSON = file_get_contents('php://input'); // Obtiene el cuerpo del JSON enviado desde JS
$input = json_decode($inputJSON, true);        // Convierte el JSON a un array PHP
$userMessage = $input["message"] ?? "";        // Toma el valor del mensaje o deja vacío

// Construcción de las instrucciones + mensaje del usuario (prompt)
$instructions = <<<PROMPT
Eres un asistente de apoyo emocional diseñado exclusivamente para estudiantes que necesitan contención emocional.

Tu rol es acompañar, escuchar con empatía y ofrecer orientación emocional básica, sin invadir temas que correspondan a la atención profesional.

Siempre debes:
- Aclarar que no eres un psicólogo ni terapeuta profesional.
- Recomendar que acudan con un profesional si lo necesitan.
- Ser empático, amable, respetuoso y comprensivo.
- Evitar cualquier tipo de consejo médico, diagnóstico o intervención de crisis.
- No responder a temas que no sean de apoyo emocional.

Si alguien hace una pregunta fuera de tema, responde:
“Lo siento, pero solo puedo ayudarte con apoyo emocional general. Para otros temas es importante consultar con un profesional o persona de confianza.”

Siempre actúas con extrema responsabilidad y cuidado. Solo compartes técnicas sencillas de regulación emocional como respiración, frases de motivación, descanso consciente, escucha empática y validación emocional.

En todas tus respuestas debes incluir una frase recordatoria como:
“Si sientes que la situación te supera, no dudes en acudir con un profesional de salud mental.”

Identifica el idioma del usuario automáticamente y responde en ese mismo idioma, manteniendo un tono claro, empático y profesional.

Organiza tu respuesta de forma clara y útil, pero asegúrate de que no sea demasiado extensa. No superes el equivalente aproximado a 200 tokens. Si el tema requiere más explicación, enfócate solo en los puntos principales o sugiere continuar más adelante.

Usuario: $userMessage
Asistente:
PROMPT;

// Prepara los datos a enviar a la API (prompt + configuración)
$payload = [
    "inputs" => $instructions,
    "parameters" => [
        "max_new_tokens" => 200,          // Límite máximo de tokens en la respuesta
        "temperature" => 0.5,             // Controla la creatividad: 0 = más precisa, 1 = más creativa
        "top_p" => 0.9,                   // Estrategia para seleccionar palabras más probables
        "repetition_penalty" => 1.2,      // Penaliza respuestas repetidas
        "stop" => ["Usuario:", "Asistente:", "Usuario"] // Indica dónde debe detenerse la generación
    ]
];

// Inicializa cURL para hacer la petición a Hugging Face
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api-inference.huggingface.co/models/$model"); // URL del modelo
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token",             // Autorización con tu token
    "Content-Type: application/json"            // Indica que se envía JSON
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload)); // Envía el prompt como JSON

// Ejecuta la petición y guarda la respuesta
$response = curl_exec($ch);
curl_close($ch); // Cierra la conexión cURL

// Guarda la respuesta en un archivo para depuración (opcional)
file_put_contents("debug_respuesta.json", $response);

// Procesa la respuesta del modelo
$respuestaLimpia = "No pude generar una respuesta.";
$data = json_decode($response, true);

// Verifica distintas estructuras posibles de respuesta y extrae el texto
if (isset($data[0]["generated_text"])) {
    $respuestaLimpia = trim($data[0]["generated_text"]);
} elseif (isset($data["generated_text"])) {
    $respuestaLimpia = trim($data["generated_text"]);
} elseif (isset($data["choices"][0]["message"]["content"])) {
    $respuestaLimpia = trim($data["choices"][0]["message"]["content"]);
}

// Envía la respuesta limpia como JSON al frontend
echo json_encode([
    "choices" => [
        ["message" => ["content" => $respuestaLimpia]]
    ]
]);
?>
