package identidad

// Declarado es lo que el cliente escribio en el formulario de Ayiti.
type Declarado struct {
	Nombres         string
	Apellidos       string
	NumeroIdentidad string
	RUT             string
}

type EstadoCampo string

const (
	CampoCoincide   EstadoCampo = "coincide"
	CampoNoCoincide EstadoCampo = "no_coincide"
	CampoSinDato    EstadoCampo = "sin_dato"
)

const (
	EstadoCoincide   = "coincide"
	EstadoNoCoincide = "no_coincide"
	EstadoIncompleto = "incompleto"
	EstadoPendiente  = "pendiente"
)

type Campo struct {
	Campo     string      `json:"campo"`
	Etiqueta  string      `json:"etiqueta"`
	Declarado string      `json:"declarado"`
	Documento string      `json:"documento"`
	Estado    EstadoCampo `json:"estado"`
}

// Resultado es el cruce formulario vs OCR. Lo calcula este modulo, no Idantite.
type Resultado struct {
	Estado   string  `json:"estado"`
	Coincide bool    `json:"coincide"`
	Resumen  string  `json:"resumen"`
	Campos   []Campo `json:"campos"`
}

// Cruzar compara lo declarado con lo extraido del documento.
// Espacios, mayusculas y acentos no cuentan como diferencia.
func Cruzar(d Declarado, e Extraido) Resultado {
	campos := []Campo{
		compararNombre("nombres", "Nombres", d.Nombres, e.Nombres),
		compararNombre("apellidos", "Apellidos", d.Apellidos, e.Apellidos),
		compararID("numero_identidad", "Numero de identidad", d.NumeroIdentidad, e.NumeroIdentidad),
		compararID("rut", "RUT", d.RUT, e.RUT),
	}

	nCoinciden := 0
	nNo := 0
	nSin := 0
	for _, c := range campos {
		switch c.Estado {
		case CampoCoincide:
			nCoinciden++
		case CampoNoCoincide:
			nNo++
		case CampoSinDato:
			nSin++
		}
	}

	out := Resultado{Campos: campos}
	switch {
	case nNo > 0:
		out.Estado = EstadoNoCoincide
		out.Resumen = "El documento verificado no corresponde a los datos que ingreso el cliente."
	case nSin > 0:
		out.Estado = EstadoIncompleto
		out.Resumen = "La verificacion llego, pero el documento no trajo todos los campos para cruzarlos."
	case nCoinciden == len(campos):
		out.Estado = EstadoCoincide
		out.Coincide = true
		out.Resumen = "Los datos del documento coinciden con los que ingreso el cliente."
	default:
		out.Estado = EstadoIncompleto
		out.Resumen = "No se pudo completar el cruce de datos."
	}
	return out
}

func compararNombre(id, etiqueta, declarado, documento string) Campo {
	c := Campo{
		Campo:     id,
		Etiqueta:  etiqueta,
		Declarado: CompactarEspacios(declarado),
		Documento: CompactarEspacios(documento),
	}
	if c.Documento == "" {
		c.Estado = CampoSinDato
		return c
	}
	if c.Declarado == "" {
		c.Estado = CampoNoCoincide
		return c
	}
	if declaradoCabeEnDocumento(c.Declarado, c.Documento) {
		c.Estado = CampoCoincide
		return c
	}
	c.Estado = CampoNoCoincide
	return c
}

func compararID(id, etiqueta, declarado, documento string) Campo {
	c := Campo{
		Campo:     id,
		Etiqueta:  etiqueta,
		Declarado: CompactarEspacios(declarado),
		Documento: CompactarEspacios(documento),
	}
	if CompactarID(c.Documento) == "" {
		c.Estado = CampoSinDato
		return c
	}
	if CompactarID(c.Declarado) == "" {
		c.Estado = CampoNoCoincide
		return c
	}
	if idsIguales(c.Declarado, c.Documento) {
		c.Estado = CampoCoincide
		return c
	}
	c.Estado = CampoNoCoincide
	return c
}
