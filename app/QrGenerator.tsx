"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import QRCode from "qrcode";
import { buildPayload, MAX_INPUT_LENGTH, QR_TYPES, type Field, type QrType, type Values } from "@/lib/payload";

const QR_OPTIONS = { margin: 2, errorCorrectionLevel: "M" as const };

function download(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
}

function FieldInput({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  const id = `field-${field.name}`;

  if (field.kind === "checkbox") {
    return (
      <div className="field">
        <label className="checkbox" htmlFor={id}>
          <input id={id} type="checkbox" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "")} />{" "}
          {field.label}
        </label>
      </div>
    );
  }

  const common = {
    id,
    value,
    required: field.required,
    placeholder: field.placeholder,
    maxLength: MAX_INPUT_LENGTH,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(e.target.value),
  };

  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {field.label}
        {field.required && <span className="has-text-danger"> *</span>}
      </label>
      <div className="control">
        {field.kind === "textarea" ? (
          <textarea className="textarea" rows={4} {...common} />
        ) : field.kind === "select" ? (
          <div className="select is-fullwidth">
            <select {...common} value={value || field.options?.[0]?.value}>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input
            className="input"
            type={field.kind}
            step={field.kind === "number" ? "any" : undefined}
            autoComplete="off"
            {...common}
          />
        )}
      </div>
    </div>
  );
}

export default function QrGenerator() {
  const [type, setType] = useState<QrType>("url");
  const [values, setValues] = useState<Values>({});
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  let payload = "";
  let payloadError = "";
  try {
    payload = buildPayload(type, values);
  } catch (e) {
    payloadError = e instanceof Error ? e.message : "Invalid input.";
  }

  useEffect(() => {
    let cancelled = false;
    if (!payload) {
      setImage("");
      setError(payloadError);
      return;
    }
    QRCode.toDataURL(payload, { ...QR_OPTIONS, width: 512 })
      .then((url) => {
        if (cancelled) return;
        setImage(url);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setImage("");
        setError("The content is too long to fit in a QR code.");
      });
    return () => {
      cancelled = true;
    };
  }, [payload, payloadError]);

  const selectType = (next: QrType) => {
    setType(next);
    setValues({});
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(payload, { ...QR_OPTIONS, type: "svg" });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    download(url, `qr-${type}.svg`);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="hero is-link">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">QR Code Generator</h1>
            <p className="subtitle">Websites, Wi-Fi, contacts, WhatsApp and more.</p>
          </div>
        </div>
      </section>

      <main className="section">
        <div className="container">
          <div className="buttons" role="tablist" aria-label="QR code type">
            {(Object.keys(QR_TYPES) as QrType[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={key === type}
                className={`button is-link is-rounded ${key === type ? "" : "is-outlined"}`}
                onClick={() => selectType(key)}
              >
                {QR_TYPES[key].label}
              </button>
            ))}
          </div>

          <div className="columns">
            <div className="column">
              <form className="box" onSubmit={(e) => e.preventDefault()}>
                {QR_TYPES[type].fields.map((field) => (
                  <FieldInput
                    key={`${type}-${field.name}`}
                    field={field}
                    value={values[field.name] ?? ""}
                    onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
                  />
                ))}
              </form>
            </div>

            <div className="column is-5">
              <section className="box preview has-text-centered" aria-live="polite">
                {image ? (
                  <>
                    <img src={image} alt="Generated QR code" width={256} height={256} />
                    <div className="buttons is-centered">
                      <button type="button" className="button is-link" onClick={() => download(image, `qr-${type}.png`)}>
                        Download PNG
                      </button>
                      <button type="button" className="button is-link" onClick={downloadSvg}>
                        Download SVG
                      </button>
                    </div>
                  </>
                ) : error ? (
                  <p className="notification is-danger is-light">{error}</p>
                ) : (
                  <p className="has-text-grey">Fill in the fields to generate your QR code.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer has-text-centered">
        <p>
          Made by:{" "}
          <a href="https://github.com/renanbaluarte" target="_blank" rel="noopener noreferrer">
            Renan Ferreira
          </a>
        </p>
      </footer>
    </>
  );
}
