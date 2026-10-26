export type QrType =
  | "url"
  | "text"
  | "wifi"
  | "contact"
  | "whatsapp"
  | "email"
  | "sms"
  | "phone"
  | "location";

export type FieldKind = "text" | "textarea" | "tel" | "email" | "password" | "number" | "select" | "checkbox";

export type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export type Values = Record<string, string>;

export const MAX_INPUT_LENGTH = 1000;

export const QR_TYPES: Record<QrType, { label: string; fields: Field[] }> = {
  url: {
    label: "Website",
    fields: [{ name: "url", label: "URL", kind: "text", required: true, placeholder: "https://example.com" }],
  },
  text: {
    label: "Text",
    fields: [{ name: "text", label: "Text", kind: "textarea", required: true }],
  },
  wifi: {
    label: "Wi-Fi",
    fields: [
      { name: "ssid", label: "Network name (SSID)", kind: "text", required: true },
      {
        name: "encryption",
        label: "Security",
        kind: "select",
        options: [
          { value: "WPA", label: "WPA/WPA2/WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None" },
        ],
      },
      { name: "password", label: "Password", kind: "password" },
      { name: "hidden", label: "Hidden network", kind: "checkbox" },
    ],
  },
  contact: {
    label: "Contact",
    fields: [
      { name: "firstName", label: "First name", kind: "text" },
      { name: "lastName", label: "Last name", kind: "text" },
      { name: "phone", label: "Phone", kind: "tel" },
      { name: "email", label: "Email", kind: "email" },
      { name: "organization", label: "Company", kind: "text" },
      { name: "title", label: "Job title", kind: "text" },
      { name: "website", label: "Website", kind: "text" },
    ],
  },
  whatsapp: {
    label: "WhatsApp",
    fields: [
      { name: "phone", label: "Phone with country code", kind: "tel", required: true, placeholder: "+55 11 91234-5678" },
      { name: "message", label: "Message", kind: "textarea" },
    ],
  },
  email: {
    label: "Email",
    fields: [
      { name: "to", label: "To", kind: "email", required: true },
      { name: "subject", label: "Subject", kind: "text" },
      { name: "body", label: "Message", kind: "textarea" },
    ],
  },
  sms: {
    label: "SMS",
    fields: [
      { name: "phone", label: "Phone", kind: "tel", required: true },
      { name: "message", label: "Message", kind: "textarea" },
    ],
  },
  phone: {
    label: "Phone",
    fields: [{ name: "phone", label: "Phone", kind: "tel", required: true }],
  },
  location: {
    label: "Location",
    fields: [
      { name: "latitude", label: "Latitude", kind: "number", required: true, placeholder: "-23.5505" },
      { name: "longitude", label: "Longitude", kind: "number", required: true, placeholder: "-46.6333" },
    ],
  },
};

const escapeWifi = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");

const escapeVCard = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/([;,])/g, "\\$1").replace(/\r?\n/g, "\\n");

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const cleanPhone = (value: string) => {
  const digits = digitsOnly(value);
  if (!digits) throw new Error("Enter a valid phone number.");
  return value.trim().startsWith("+") ? `+${digits}` : digits;
};

const cleanEmail = (value: string) => {
  if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value)) throw new Error("Enter a valid email address.");
  return value;
};

const parseCoordinate = (value: string, limit: number, name: string) => {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > limit) {
    throw new Error(`${name} must be between -${limit} and ${limit}.`);
  }
  return number;
};

const withQuery = (base: string, params: Record<string, string>) => {
  const query = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return query ? `${base}?${query}` : base;
};

export function buildPayload(type: QrType, values: Values): string {
  const v = (name: string) => (values[name] ?? "").trim();
  const missingRequired = QR_TYPES[type].fields.some((field) => field.required && !v(field.name));
  if (missingRequired) return "";

  switch (type) {
    case "url": {
      const url = v("url");
      return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
    }
    case "text":
      return values.text ?? "";
    case "wifi": {
      const encryption = v("encryption") || "WPA";
      const password = encryption === "nopass" ? "" : `P:${escapeWifi(values.password ?? "")};`;
      const hidden = v("hidden") === "true" ? "H:true;" : "";
      return `WIFI:T:${encryption};S:${escapeWifi(v("ssid"))};${password}${hidden};`;
    }
    case "contact": {
      const fullName = [v("firstName"), v("lastName")].filter(Boolean).join(" ");
      if (!fullName && !v("phone") && !v("email") && !v("organization")) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escapeVCard(v("lastName"))};${escapeVCard(v("firstName"))};;;`,
        `FN:${escapeVCard(fullName || v("organization"))}`,
        v("organization") && `ORG:${escapeVCard(v("organization"))}`,
        v("title") && `TITLE:${escapeVCard(v("title"))}`,
        v("phone") && `TEL;TYPE=CELL:${cleanPhone(v("phone"))}`,
        v("email") && `EMAIL:${escapeVCard(v("email"))}`,
        v("website") && `URL:${escapeVCard(v("website"))}`,
        "END:VCARD",
      ];
      return lines.filter(Boolean).join("\r\n");
    }
    case "whatsapp":
      return withQuery(`https://wa.me/${digitsOnly(cleanPhone(v("phone")))}`, { text: v("message") });
    case "email":
      return withQuery(`mailto:${cleanEmail(v("to"))}`, { subject: v("subject"), body: v("body") });
    case "sms":
      return `SMSTO:${cleanPhone(v("phone"))}:${v("message")}`;
    case "phone":
      return `tel:${cleanPhone(v("phone"))}`;
    case "location": {
      const latitude = parseCoordinate(v("latitude"), 90, "Latitude");
      const longitude = parseCoordinate(v("longitude"), 180, "Longitude");
      return `geo:${latitude},${longitude}`;
    }
  }
}
