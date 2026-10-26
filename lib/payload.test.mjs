import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPayload } from "./payload.ts";

test("url adds https when scheme is missing", () => {
  assert.equal(buildPayload("url", { url: "example.com" }), "https://example.com");
  assert.equal(buildPayload("url", { url: "http://a.b" }), "http://a.b");
});

test("returns empty payload while required fields are missing", () => {
  assert.equal(buildPayload("url", { url: "  " }), "");
  assert.equal(buildPayload("wifi", {}), "");
  assert.equal(buildPayload("contact", {}), "");
});

test("wifi escapes special characters", () => {
  assert.equal(
    buildPayload("wifi", { ssid: 'My;Net', password: 'p:a"ss\\', hidden: "true" }),
    'WIFI:T:WPA;S:My\\;Net;P:p\\:a\\"ss\\\\;H:true;;',
  );
  assert.equal(buildPayload("wifi", { ssid: "Open", encryption: "nopass", password: "x" }), "WIFI:T:nopass;S:Open;;");
});

test("contact builds an escaped vCard", () => {
  const card = buildPayload("contact", { firstName: "Ana", lastName: "Silva, Jr", phone: "+55 (11) 9999-0000" });
  assert.match(card, /^BEGIN:VCARD\r\nVERSION:3\.0\r\n/);
  assert.match(card, /N:Silva\\, Jr;Ana;;;/);
  assert.match(card, /TEL;TYPE=CELL:\+551199990000/);
  assert.match(card, /END:VCARD$/);
});

test("whatsapp uses digits and encodes the message", () => {
  assert.equal(buildPayload("whatsapp", { phone: "+55 11 91234-5678", message: "Hi & bye" }), "https://wa.me/5511912345678?text=Hi%20%26%20bye");
  assert.equal(buildPayload("whatsapp", { phone: "5511" }), "https://wa.me/5511");
});

test("email validates the address and encodes params", () => {
  assert.equal(buildPayload("email", { to: "a@b.com", subject: "Hello there" }), "mailto:a@b.com?subject=Hello%20there");
  assert.throws(() => buildPayload("email", { to: "a@b.com?cc=x@y.com" }));
});

test("sms, phone and location", () => {
  assert.equal(buildPayload("sms", { phone: "+1 555 0100", message: "Hi" }), "SMSTO:+15550100:Hi");
  assert.equal(buildPayload("phone", { phone: "(11) 4000-1234" }), "tel:1140001234");
  assert.throws(() => buildPayload("phone", { phone: "abc" }));
  assert.equal(buildPayload("location", { latitude: "-23.5", longitude: "-46.6" }), "geo:-23.5,-46.6");
  assert.throws(() => buildPayload("location", { latitude: "91", longitude: "0" }));
});
