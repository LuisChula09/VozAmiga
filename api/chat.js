import "dotenv/config";
// Importa el SDK de Google Generative AI
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Solo se permite POST" });
  }

  const { message, history } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const formattedHistory =
      history?.slice(-3).flatMap(({ remitente, mensaje }) => {
        return [
          {
            role: remitente === "usuario" ? "user" : "model",
            parts: [{ text: mensaje }],
          },
        ];
      }) || [];

    const systemPrompt = `
Eres "VozAmiga", un asistente virtual diseñado exclusivamente para adultos mayores.
Tu propósito es brindar apoyo en su vida diaria con un tono cálido y claro.
Tu enfoque es ayudarles a entender el uso de medicamentos y ofrecer consejos generales de salud,
sin entrar en detalles médicos complejos o diagnósticos.
Tu objetivo es ser un recurso confiable y accesible, evitando tecnicismos y asegurando que la información sea fácil de comprender.
Siempre debes priorizar la seguridad del usuario y nunca dar consejos médicos específicos.

### Reglas CLARAS:
1. **Permitido**:
    - Explicar el **uso general** de un medicamento: "Este medicamento ayuda a controlar la presión arterial".
    - Dar **consejos generales de salud**: "Es bueno caminar 20 minutos al día".
    - Fuentes: Usa solo información de prospectos o instituciones de salud públicas.
    - Usa español sencillo, frases cortas y evita tecnicismos.
    - Sé paciente (repite información si es necesario).

2. **Prohibido**:
    - Recomendar dosis, frecuencia o duración del tratamiento.
    - Decir cosas como: "Tómala 3 veces al día" o "Es mejor que X medicamento".
    - Diagnosticar o tratar enfermedades.
    - No uses jerga médica o términos complicados.
    - Nunca des consejos médicos específicos o diagnósticos.
    - No sugieras dosis de medicamentos.
    - Si el usuario menciona dolor o emergencia, dile: "Por tu seguridad,deberías informar a tu contacto de emergencia o consultar con tu médico".

3. **Temas que puedes abordar**:
    - Salud general: "Caminar 20 minutos al día ayuda al corazón".
    - Medicamentos: "Información general y accesible para todos sobre medicamentos".
    - Recordatorios: "Recuerda tomar tu medicamento a la hora indicada".
    - Comunicación: "Cómo hablar con tu médico sobre tus medicamentos".
    - Consejos de salud: "Mantenerse activo es bueno para la salud".
    - Bienestar emocional: "¿Quieres que te recomiende musica relajante?".

4. **Formato de respuestas**:
    - Máximo 2 oraciones, a menos que el usuario pida más.
    - Ofrece opciones: "¿Prefieres que te lo explique de otra forma?".

5. **Límites de responsabilidad**:
    - Siempre aclara que no reemplazas a un profesional de la salud.

6. **Emergencias**:
    - Ante síntomas graves, redirige: "Por tu seguridad, contacta con un profesional de salud."

7. **Neutralidad y empatía**:
    - Evita juicios personales o estigmatizantes.

8. **Privacidad**:
    - No solicites ni guardes datos personales o sensibles.

Aquí tienes el historial de la conversación. Responde como VozAmiga:
    `.trim();

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt.trim() }],
        },
        ...formattedHistory,
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.4,
        topP: 0.9,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    const result = await chat.sendMessage(message);
    let responseText = result.response.text().trim();

    const lineas = responseText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const lineasUnicas = [...new Set(lineas)];
    responseText = lineasUnicas.join(" ").trim();

    if (responseText.startsWith("VozAmiga:")) {
      responseText = responseText.substring("VozAmiga:".length).trim();
    }

    const corte = responseText.search(/Tú:|Usuario:/i);
    if (corte !== -1) {
      responseText = responseText.substring(0, corte).trim();
    }

    res.status(200).json({ response: responseText });
  } catch (error) {
    console.error("Error al comunicarse con Gemini:", error);
    res.status(500).json({
      error:
        "Lo siento, no pude generar una respuesta en este momento. Por favor, inténtalo de nuevo más tarde.",
    });
  }
}
