# QR Code Generator

A simple QR code generator built with Next.js and Bulma. Everything runs in the browser: nothing is sent to a server and nothing is stored.

## Supported QR code types

| Type     | What it encodes                                                     |
| -------- | ------------------------------------------------------------------- |
| Website  | A URL (`https://` is added when missing)                            |
| Text     | Plain text                                                          |
| Wi-Fi    | Network name, security (WPA/WEP/none), password and hidden flag     |
| Contact  | A vCard 3.0 with name, phone, email, company, job title and website |
| WhatsApp | A `wa.me` link with an optional pre-filled message                  |
| Email    | A `mailto:` link with subject and message                           |
| SMS      | Phone number and message                                            |
| Phone    | A `tel:` link                                                       |
| Location | Geographic coordinates (`geo:` URI)                                 |

Generated codes can be downloaded as PNG or SVG.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with React and TypeScript
- [Bulma](https://bulma.io) for styling
- [qrcode](https://github.com/soldair/node-qrcode) for QR code rendering

## Getting started

Requirements: Node.js 22.18 or newer (the tests rely on native TypeScript support).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Start the development server                       |
| `npm run build` | Create a production build                          |
| `npm start`     | Run the production build                           |
| `npm test`      | Run the payload tests with the Node.js test runner |

## Project structure

```
app/
  layout.tsx        Root layout, metadata and global styles
  page.tsx          Home page
  QrGenerator.tsx   Form, preview and download UI
  globals.css       Bulma color overrides and small layout tweaks
lib/
  payload.ts        QR types, form fields and payload builders
  payload.test.mjs  Tests for the payload builders
```

To add a new QR type, add an entry to `QR_TYPES` and a matching case in `buildPayload` in `lib/payload.ts`. The form is rendered automatically from the field list.

## Deploying to Vercel

The app is fully static and needs no environment variables. Import the repository on [Vercel](https://vercel.com/new) and keep the default Next.js settings.
