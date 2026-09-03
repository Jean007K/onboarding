package identidad

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Extraido es lo que nos interesa del OCR de Emverax (extracted_data).
type Extraido struct {
	Nombres   string
	Apellidos string
	RUT       string
}

func FromJSON(raw json.RawMessage) Extraido {
	if len(raw) == 0 {
		return Extraido{}
	}
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return Extraido{}
	}
	return Extraido{
		Nombres:   firstString(m, "nombres", "first_name", "given_names", "given_name"),
		Apellidos: firstString(m, "apellidos", "last_name", "surname", "family_name"),
		RUT:       firstString(m, "rut", "tax_id", "run"),
	}
}

func firstString(m map[string]any, keys ...string) string {
	for _, k := range keys {
		if v, ok := m[k]; ok {
			s := strings.TrimSpace(fmt.Sprint(v))
			if s != "" && s != "<nil>" {
				return s
			}
		}
	}
	return ""
}
