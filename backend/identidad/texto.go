package identidad

import (
	"strings"
	"unicode"
	"unicode/utf8"
)

// CompactarEspacios recorta extremos y deja un solo espacio entre palabras.
func CompactarEspacios(s string) string {
	return strings.Join(strings.Fields(s), " ")
}

// NormalizarNombre es lo que guardamos: sin espacios de más y cada palabra
// con la primera letra en mayúscula. "  calixte " y "CALIXTE" quedan "Calixte".
func NormalizarNombre(s string) string {
	s = CompactarEspacios(s)
	if s == "" {
		return ""
	}
	parts := strings.Fields(s)
	for i, p := range parts {
		parts[i] = titleWord(p)
	}
	return strings.Join(parts, " ")
}

func titleWord(s string) string {
	s = strings.ToLower(s)
	r, size := utf8.DecodeRuneInString(s)
	if r == utf8.RuneError {
		return s
	}
	return string(unicode.ToTitle(r)) + s[size:]
}

func foldNombre(s string) string {
	s = strings.ToLower(CompactarEspacios(s))
	return quitarAcentos(s)
}

func quitarAcentos(s string) string {
	repl := strings.NewReplacer(
		"á", "a", "à", "a", "ä", "a", "â", "a", "ã", "a",
		"é", "e", "è", "e", "ë", "e", "ê", "e",
		"í", "i", "ì", "i", "ï", "i", "î", "i",
		"ó", "o", "ò", "o", "ö", "o", "ô", "o", "õ", "o",
		"ú", "u", "ù", "u", "ü", "u", "û", "u",
		"ñ", "n", "ç", "c",
		"ý", "y", "ÿ", "y",
	)
	return repl.Replace(s)
}

func tokensNombre(s string) []string {
	s = foldNombre(s)
	if s == "" {
		return nil
	}
	return strings.Fields(s)
}

func tokensIguales(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// declaradoCabeEnDocumento: el cliente puede poner menos nombres de los que
// trae la cedula ("Jean" vs "JEAN KENEL"), pero no nombres de mas.
func declaradoCabeEnDocumento(declarado, documento string) bool {
	d := tokensNombre(declarado)
	e := tokensNombre(documento)
	if len(d) == 0 || len(e) == 0 {
		return false
	}
	if tokensIguales(d, e) {
		return true
	}
	have := map[string]int{}
	for _, t := range e {
		have[t]++
	}
	for _, t := range d {
		if have[t] == 0 {
			return false
		}
		have[t]--
	}
	return true
}
