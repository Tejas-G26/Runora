# Runora

Runora is an AI-powered business management platform for small businesses.

It brings **orders, inventory, customers, expenses, payments, invoices, analytics, and an AI assistant** into one place. The frontend is a lightweight HTML/CSS/JavaScript application backed by Supabase.

## Features

- Dashboard & business analytics
- Order management
- Inventory tracking
- Customer management
- Expense tracking
- Payment tracking
- Invoice generation
- AI business assistant
- Supabase Authentication & PostgreSQL

## Tech Stack

- HTML, CSS, JavaScript
- Supabase
- Supabase Edge Functions
- Gemini AI
- Chart.js
- Font Awesome

## Project Structure

```text
.
├── index.html
├── schema.md
└── assistantEdgeFunction.md
```

## Supabase Setup

1. Create a Supabase project.
2. Apply the database schema described in [`schema.md`](schema.md).
3. Configure authentication.
4. Deploy the `ai-assistant` Edge Function using [`assistantEdgeFunction.md`](assistantEdgeFunction.md).
5. Add the required AI secret to Supabase Edge Function secrets.
6. Configure the Supabase URL and anon key in the frontend.

> Never expose service-role keys or AI API keys in the frontend.

## AI Assistant

The frontend calls the Supabase Edge Function named `ai-assistant` and sends the current message plus the latest conversation history. The function should return:

```json
{
  "success": true,
  "reply": "Your AI response"
}
```

See [`assistantEdgeFunction.md`](assistantEdgeFunction.md) for the API contract and deployment reference.

## Data Model

Runora stores business data using separate Supabase tables for businesses, products, customers, orders, expenses, payments, and invoices.

See [`schema.md`](schema.md) for the documented data model and relationships.

## License

Add your preferred license here.
