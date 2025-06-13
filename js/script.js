
let historialConversacion = [];
// Esta función agrega un nuevo mensaje al área del chat
function agregarAlChat(remitente, mensaje) {
  const chat = document.getElementById("chat"); // Obtiene el contenedor del chat
  const nuevoMensaje = document.createElement("div"); // Crea un nuevo elemento div para el mensaje

  // Establece la clase CSS dependiendo de quién envía el mensaje (usuario o bot)
  nuevoMensaje.className = remitente === "Tú" ? "user-message align-self-end" : "bot-message align-self-start";

  // Reemplaza los saltos de línea con <br> para que se vean bien en HTML
  const mensajeConFormato = mensaje.replace(/\n/g, "<br>");

  // Inserta el mensaje dentro del nuevo elemento HTML
  nuevoMensaje.innerHTML = `<strong>${remitente}:</strong> ${mensajeConFormato}`;

  // Añade el mensaje al final del chat
  chat.appendChild(nuevoMensaje);

  // Hace scroll automático hacia abajo
  chat.scrollTop = chat.scrollHeight;
  // Guarda el mensaje en el historial de conversación
  historialConversacion.push({ remitente, mensaje });
}

// Variable global para el intervalo de animación de los puntos suspensivos
let dotsInterval = null;

// Esta función se ejecuta cuando el usuario envía un mensaje
async function enviarMensaje() {
  const input = document.getElementById("input"); // Obtiene el textarea
  const mensajeUsuario = input.value.trim(); // Obtiene el mensaje del usuario sin espacios al inicio o final
  const typing = document.getElementById("typing"); // Elemento donde se muestra “Bot está escribiendo...”
  const dots = document.getElementById("dots"); // Elemento donde se animan los puntos suspensivos

  if (mensajeUsuario === "") return; // Si el campo está vacío, no hace nada

  agregarAlChat("Tú", mensajeUsuario); // Muestra el mensaje del usuario en pantalla
  input.value = ""; // Limpia el campo de entrada

  // Muestra el mensaje de que el bot está escribiendo
  typing.style.display = "block";
  dots.textContent = ".";

  // Comienza la animación de puntos (de 1 a 3 puntos repetitivos)
  dotsInterval = setInterval(() => {
    dots.textContent = dots.textContent.length >= 3 ? "." : dots.textContent + ".";
  }, 500);

  try {
    // Llama al backend para obtener la respuesta del modelo IA
    const respuesta = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: mensajeUsuario,
        history: historialConversacion
      })
    });

    // Convierte la respuesta en JSON y extrae el texto generado
    const data = await respuesta.json();
    const mensajeIA = data.response.trim();
    agregarAlChat("VozAmiga", mensajeIA);
    historialConversacion.push({ remitente: "VozAmiga", mensaje: mensajeIA });

  } catch (error) {
    agregarAlChat("VozAmiga",
      "Lo siento, no pude responder en este momento. Intenta nuevamente en unos minutos. " +
      "Si necesitas ayuda urgente, contacta a un familiar o profesional de salud.");
    console.error("Error al contactar con el backend:", error);
  } finally {
    clearInterval(dotsInterval);
    typing.style.display = "none";
  }
}
// función para generar el PDF de la conversación 
// sin implementar en la app principal, pero disponible para uso futuro
async function generarPDFConversacion() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10; // posición vertical

  historialConversacion.forEach(({ remitente, mensaje }) => {
    const texto = `${remitente}: ${mensaje}`;
    const lineas = doc.splitTextToSize(texto, 180);

    if (y + lineas.length * 10 > 280) {
      doc.addPage();
      y = 10;
    }

    doc.text(lineas, 10, y);
    y += lineas.length * 10;
  });

  const fecha = new Date().toISOString().split("T")[0];
  doc.save(`conversacion_${fecha}.pdf`);
}
