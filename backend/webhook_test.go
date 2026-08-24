package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"testing"
)

func TestFirmaValida(t *testing.T) {
	secret := "s3cret"
	body := []byte(`{"event":"verification.completed","session_id":"abc"}`)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	okSig := hex.EncodeToString(mac.Sum(nil))

	if !firmaValida(secret, body, okSig) {
		t.Fatal("deberia aceptar una firma buena")
	}
	if !firmaValida(secret, body, stringsUpper(okSig)) {
		t.Fatal("deberia aceptar la firma en mayusculas")
	}
	if firmaValida(secret, body, "00"+okSig[2:]) {
		t.Fatal("no deberia aceptar una firma distinta")
	}
	if firmaValida("", body, okSig) {
		t.Fatal("sin secret no hay firma valida")
	}
}

func stringsUpper(s string) string {
	b := []byte(s)
	for i, c := range b {
		if c >= 'a' && c <= 'f' {
			b[i] = c - 32
		}
	}
	return string(b)
}
