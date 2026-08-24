package identidad

import (
	"strings"
	"unicode"
)

// CompactarID deja solo letras y digitos, en mayusculas.
// Sirve para comparar RUT con o sin puntos y guion.
func CompactarID(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToUpper(r))
		}
	}
	return b.String()
}

// NormalizarRUT recorta, mayusculas, y si se puede lo deja con puntos y DV.
func NormalizarRUT(s string) string {
	compact := CompactarID(s)
	if compact == "" {
		return ""
	}
	return formatearRUT(compact)
}

func formatearRUT(compact string) string {
	if len(compact) < 2 {
		return compact
	}
	cuerpo := compact[:len(compact)-1]
	dv := compact[len(compact)-1:]
	var partes []string
	for len(cuerpo) > 3 {
		partes = append([]string{cuerpo[len(cuerpo)-3:]}, partes...)
		cuerpo = cuerpo[:len(cuerpo)-3]
	}
	if cuerpo != "" {
		partes = append([]string{cuerpo}, partes...)
	}
	return strings.Join(partes, ".") + "-" + dv
}

func idsIguales(a, b string) bool {
	ca, cb := CompactarID(a), CompactarID(b)
	return ca != "" && ca == cb
}
