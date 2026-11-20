export function registrationErrorMessage(message: string, code?: string) {
  if (code === "23505") return "Este email ya tiene un registro para este evento.";
  if (code === "22023") return "Ingresa un nombre y un email válidos.";
  if (message.startsWith("Este evento ya no está disponible")) return "Este evento ya no está disponible para registros.";
  if (message.startsWith("La entrada seleccionada ya no está disponible")) return "La entrada seleccionada ya no está disponible.";
  if (message.startsWith("Esta entrada ya no tiene cupos")) return "Esta entrada ya no tiene cupos. Elige otra opción.";
  if (message.startsWith("El evento ya no tiene cupos")) return "El evento ya no tiene cupos disponibles.";
  return "No se pudo confirmar el registro. Inténtalo de nuevo.";
}
