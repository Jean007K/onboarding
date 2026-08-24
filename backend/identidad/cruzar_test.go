package identidad

import (
	"encoding/json"
	"testing"
)

func TestNormalizarNombreEspaciosYCaja(t *testing.T) {
	casos := []struct {
		in, want string
	}{
		{" Calixte", "Calixte"},
		{"Calixte ", "Calixte"},
		{"  Calixte  ", "Calixte"},
		{"calixte", "Calixte"},
		{"CALIXTE", "Calixte"},
		{"  jean   kenel ", "Jean Kenel"},
		{"JEAN KENEL", "Jean Kenel"},
		{"", ""},
		{"   ", ""},
	}
	for _, c := range casos {
		got := NormalizarNombre(c.in)
		if got != c.want {
			t.Errorf("NormalizarNombre(%q)=%q want %q", c.in, got, c.want)
		}
	}
}

func TestNormalizarRUT(t *testing.T) {
	casos := []struct {
		in, want string
	}{
		{"25.925.129-K", "25.925.129-K"},
		{"25925129k", "25.925.129-K"},
		{" 25.925.129-k ", "25.925.129-K"},
		{"25 925 129 K", "25.925.129-K"},
	}
	for _, c := range casos {
		got := NormalizarRUT(c.in)
		if got != c.want {
			t.Errorf("NormalizarRUT(%q)=%q want %q", c.in, got, c.want)
		}
	}
}

func TestCruzarCoincidenAunqueCajaYPuntos(t *testing.T) {
	d := Declarado{
		Nombres:         "  jean  kenel ",
		Apellidos:       "calixte",
		NumeroIdentidad: "b00.147.414",
		RUT:             "25925129k",
	}
	e := Extraido{
		Nombres:         "JEAN KENEL",
		Apellidos:       "CALIXTE",
		NumeroIdentidad: "B00.147.414",
		RUT:             "25.925.129-K",
	}
	r := Cruzar(d, e)
	if !r.Coincide || r.Estado != EstadoCoincide {
		t.Fatalf("estado=%s coincide=%v resumen=%s campos=%v", r.Estado, r.Coincide, r.Resumen, r.Campos)
	}
}

func TestCruzarNombreParcialDelDocumento(t *testing.T) {
	d := Declarado{Nombres: "Jean", Apellidos: "Calixte", NumeroIdentidad: "B00.147.414", RUT: "25.925.129-K"}
	e := Extraido{Nombres: "JEAN KENEL", Apellidos: "CALIXTE", NumeroIdentidad: "B00.147.414", RUT: "25.925.129-K"}
	r := Cruzar(d, e)
	if !r.Coincide {
		t.Fatalf("Jean deberia caber en JEAN KENEL: %#v", r.Campos)
	}
}

func TestCruzarNombreDeMasNoCoincide(t *testing.T) {
	d := Declarado{Nombres: "Jean Pedro", Apellidos: "Calixte", NumeroIdentidad: "B00.147.414", RUT: "25.925.129-K"}
	e := Extraido{Nombres: "JEAN KENEL", Apellidos: "CALIXTE", NumeroIdentidad: "B00.147.414", RUT: "25.925.129-K"}
	r := Cruzar(d, e)
	if r.Coincide || r.Estado != EstadoNoCoincide {
		t.Fatalf("nombre extra no deberia coincidir: %#v", r)
	}
}

func TestCruzarOtraPersona(t *testing.T) {
	d := Declarado{Nombres: "Maria", Apellidos: "Lopez", NumeroIdentidad: "A11.222.333", RUT: "11.111.111-1"}
	e := Extraido{Nombres: "JEAN KENEL", Apellidos: "CALIXTE", NumeroIdentidad: "B00.147.414", RUT: "25.925.129-K"}
	r := Cruzar(d, e)
	if r.Coincide || r.Estado != EstadoNoCoincide {
		t.Fatalf("otra persona deberia no coincidir: %#v", r)
	}
	for _, c := range r.Campos {
		if c.Estado != CampoNoCoincide {
			t.Errorf("campo %s: %s", c.Campo, c.Estado)
		}
	}
}

func TestCruzarAcentos(t *testing.T) {
	d := Declarado{Nombres: "José", Apellidos: "Nuñez", NumeroIdentidad: "X1", RUT: "1-9"}
	e := Extraido{Nombres: "JOSE", Apellidos: "NUNEZ", NumeroIdentidad: "X1", RUT: "1-9"}
	r := Cruzar(d, e)
	if !r.Coincide {
		t.Fatalf("acentos no deberian romper el cruce: %#v", r.Campos)
	}
}

func TestCruzarOCRIncompleto(t *testing.T) {
	d := Declarado{Nombres: "Jean", Apellidos: "Calixte", NumeroIdentidad: "B00.147.414", RUT: "25.925.129-K"}
	e := Extraido{Nombres: "JEAN KENEL", Apellidos: "CALIXTE"}
	r := Cruzar(d, e)
	if r.Estado != EstadoIncompleto || r.Coincide {
		t.Fatalf("sin RUT ni documento en OCR: %#v", r)
	}
}

func TestFromJSONApproveFixture(t *testing.T) {
	raw := json.RawMessage(`{
      "nombres": "JEAN KENEL",
      "apellidos": "CALIXTE",
      "sexo": "M",
      "document_number": "B00.147.414",
      "rut": "25.925.129-K"
    }`)
	e := FromJSON(raw)
	if e.Nombres != "JEAN KENEL" || e.Apellidos != "CALIXTE" || e.NumeroIdentidad != "B00.147.414" || e.RUT != "25.925.129-K" {
		t.Fatalf("extraido mal parseado: %#v", e)
	}
}
