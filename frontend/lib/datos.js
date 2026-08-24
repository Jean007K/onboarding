export function tidyNombre(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

export function tidyRut(s) {
  const compact = String(s || "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "");
  if (compact.length < 2) return compact;
  const cuerpo = compact.slice(0, -1);
  const dv = compact.slice(-1);
  const partes = [];
  let rest = cuerpo;
  while (rest.length > 3) {
    partes.unshift(rest.slice(-3));
    rest = rest.slice(0, -3);
  }
  if (rest) partes.unshift(rest);
  return `${partes.join(".")}-${dv}`;
}

export function tituloNombre(s) {
  return tidyNombre(s)
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}
