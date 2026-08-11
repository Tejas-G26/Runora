You are a senior full-stack engineer and UI/UX designer.

Build a complete hackathon MVP called:

# WHATSAPP BUSINESS OS

Tagline:
"Your business already lives on WhatsApp. We give it an operating system."

The goal is to build a modern AI-powered business management platform for small businesses.

==================================================
TECH STACK — MUST FOLLOW
==================================================

Frontend:
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- No React
- No Next.js
- No Vue
- No Angular

Backend / Database:
- Supabase
- Supabase PostgreSQL
- Supabase Auth
- Supabase JavaScript Client

Charts:
- Chart.js via CDN

Icons:
- Lucide Icons or Font Awesome via CDN

AI:
- Design the application so an AI API can be connected later.
- For the hackathon MVP, create a mock/rule-based AI parser if no API key is available.
- NEVER expose an AI API key in frontend JavaScript.

Deployment:
- Supabase + Netlify or Vercel static hosting

==================================================
IMPORTANT DEVELOPMENT RULE
==================================================

This is a HACKATHON MVP.

Do NOT over-engineer the application.

Prioritize:

1. Working features
2. Excellent UI/UX
3. Real Supabase database
4. Real-time dashboard updates
5. AI-like business assistant
6. Impressive WhatsApp simulation
7. Smooth end-to-end demo

Do not build unnecessary enterprise features.

==================================================
PROJECT CONCEPT
==================================================

Small businesses often use WhatsApp to manage customers and orders.

But their business information is scattered across:

- WhatsApp chats
- Notebooks
- Excel
- Payment apps
- Inventory records

This creates:

- Lost orders
- Forgotten expenses
- Inventory mistakes
- Manual payment follow-ups
- No real-time profit visibility
- Poor customer management

WhatsApp Business OS solves this by combining:

WhatsApp
+
AI
+
Orders
+
Inventory
+
Customers
+
Expenses
+
Payments
+
Invoices
+
Analytics

into one simple platform.

==================================================
MAIN USER FLOW
==================================================

Customer sends:

"I need 2 blue shirts size M."

↓

AI understands the message.

↓

System checks inventory.

↓

Creates order.

↓

Updates inventory.

↓

Generates invoice.

↓

Updates revenue.

↓

Updates dashboard.

The main hackathon WOW moment should be:

ONE MESSAGE
→
COMPLETE BUSINESS WORKFLOW

==================================================
DESIGN REQUIREMENTS
==================================================

Create a premium modern SaaS UI.

Design style:

- Minimal
- Professional
- Clean
- Modern
- Responsive
- Mobile friendly
- White background
- WhatsApp-inspired green accent
- Dark navy text
- Rounded cards
- Soft shadows
- Clean typography
- Smooth hover animations
- Subtle transitions

Avoid:

- Generic Bootstrap-looking UI
- Excessive gradients
- Too many colors
- Clutter
- Huge blocks of text

Use CSS variables for theme colors.

Example:

--primary: #25D366
--primary-dark: #128C7E
--dark: #111827
--background: #F8FAFC
--card: #FFFFFF

==================================================
PROJECT STRUCTURE
==================================================

Create a clean structure like:

whatsapp-business-os/

├── index.html
├── login.html
├── dashboard.html
├── orders.html
├── inventory.html
├── customers.html
├── expenses.html
├── payments.html
├── invoices.html
├── ai-assistant.html
├── insights.html
├── settings.html
│
├── css/
│   ├── style.css
│   ├── dashboard.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── supabase.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── orders.js
│   ├── inventory.js
│   ├── customers.js
│   ├── expenses.js
│   ├── payments.js
│   ├── invoices.js
│   ├── ai-assistant.js
│   ├── insights.js
│   └── utils.js
│
└── README.md

Keep code modular.

Do not put the entire application into one JavaScript file.

==================================================
LANDING PAGE
==================================================

Create a professional landing page.

Hero section:

WHATSAPP BUSINESS OS

"Your business already lives on WhatsApp.
We give it an operating system."

Description:

"Turn conversations into orders, expenses, inventory updates, payments and business insights — powered by AI."

Buttons:

[Try Demo]
[See How It Works]

Add a visual showing:

WhatsApp Chat
→
AI
→
Business Dashboard

Feature section:

AI Business Assistant
Order Management
Inventory
Expense Tracking
Payments
Analytics

Add a simple footer.

==================================================
AUTHENTICATION
==================================================

Use Supabase Auth.

Implement:

- Sign Up
- Login
- Logout
- Session persistence

Create protected dashboard pages.

If authentication is too time-consuming for the hackathon:

Create a Demo Login button that loads the StyleHub demo account.

==================================================
SUPABASE DATABASE
==================================================

Create these tables:

1. businesses

Columns:

id
name
type
owner_id
created_at

2. customers

Columns:

id
business_id
name
phone
email
total_orders
total_spending
pending_payment
last_order_date
created_at

3. products

Columns:

id
business_id
name
category
price
cost_price
stock
minimum_stock
created_at

4. orders

Columns:

id
business_id
customer_id
total_amount
status
payment_status
created_at

5. order_items

Columns:

id
order_id
product_id
quantity
price

6. expenses

Columns:

id
business_id
category
amount
description
payment_method
expense_date
created_at

7. payments

Columns:

id
business_id
customer_id
order_id
amount
status
payment_date
created_at

8. invoices

Columns:

id
business_id
order_id
invoice_number
subtotal
tax
total
status
created_at

9. messages

Columns:

id
business_id
customer_id
message
sender
intent
created_at

==================================================
SUPABASE SECURITY
==================================================

Implement Supabase Row Level Security.

A business user should only access their own business data.

Do not expose service-role keys.

Frontend may use:

SUPABASE_URL
SUPABASE_ANON_KEY

Never put:

SUPABASE_SERVICE_ROLE_KEY

inside frontend JavaScript.

==================================================
DEMO BUSINESS
==================================================

Create demo business:

Name:
StyleHub Clothing Store

Type:
Clothing Store

Products:

1. Blue Shirt
Price: ₹800
Cost: ₹500
Stock: 15
Minimum Stock: 5

2. Black Jeans
Price: ₹1500
Cost: ₹900
Stock: 32
Minimum Stock: 5

3. White T-Shirt
Price: ₹500
Cost: ₹280
Stock: 4
Minimum Stock: 5

Customers:

Rahul Sharma
Amit Verma
Priya Patil
Sneha Joshi

Create realistic demo orders, expenses and payments.

==================================================
DASHBOARD
==================================================

Create a premium business dashboard.

Show:

TOTAL REVENUE
₹50,000

TOTAL EXPENSES
₹28,000

NET PROFIT
₹22,000

ORDERS
42

NEW CUSTOMERS
8

PENDING PAYMENTS
₹6,500

LOW STOCK
3

IMPORTANT:

These values must come from Supabase.

Do NOT permanently hardcode them.

Net profit:

Revenue - Expenses

Add:

Revenue chart
Expense chart
Recent orders
Low stock alerts
Pending payments
Best-selling products

Use Chart.js.

==================================================
ORDERS
==================================================

Create Orders page.

Show:

Order ID
Customer
Products
Quantity
Total
Payment Status
Order Status
Date

Order statuses:

New
Confirmed
Packed
Shipped
Delivered
Cancelled

Payment statuses:

Paid
Pending
Partially Paid

Allow:

Create order
View order
Update order
Update payment status

Every order must be stored in Supabase.

==================================================
INVENTORY
==================================================

Create Inventory page.

Show:

Product
Category
Price
Cost
Stock
Minimum Stock
Status

Status:

IN STOCK
LOW STOCK
OUT OF STOCK

When an order is completed:

Automatically decrease stock.

Example:

Blue Shirt:

15 → 13

Show low-stock alerts.

Allow:

Add Product
Edit Product
Add Stock
Remove Stock
Search
Filter

==================================================
EXPENSES
==================================================

Create Expenses page.

Categories:

Inventory
Rent
Electricity
Salary
Delivery
Marketing
Packaging
Other

Show:

Total Expenses
This Month
This Week
Today

Allow manual expense creation.

Example:

Amount:
₹2500

Category:
Electricity

Description:
Monthly electricity bill

Save to Supabase.

Dashboard profit should update automatically.

==================================================
CUSTOMERS
==================================================

Create Customers page.

Show:

Customer name
Phone
Total Orders
Total Spending
Pending Payment
Last Order

Customer detail view:

Order history
Payment history
Total spending
Pending amount

Add search functionality.

==================================================
PAYMENTS
==================================================

Create Payments page.

Show:

Paid
Pending
Partially Paid
Overdue

Example:

Rahul Sharma
₹1500 Pending

Amit Verma
₹800 Pending

Add:

Update Payment Status
Send Reminder

For the hackathon:

"Send Reminder" can simulate a WhatsApp reminder.

Do not require real WhatsApp API.

==================================================
INVOICE
==================================================

Create invoice generation.

Invoice should contain:

Business name
Invoice number
Customer
Products
Quantity
Price
Subtotal
Tax
Total
Payment status

Add:

Print Invoice

Optionally add:

Download PDF

==================================================
AI BUSINESS ASSISTANT
==================================================

This is the MAIN WOW FEATURE.

Create a beautiful AI chat interface.

Title:

Business AI

Subtitle:

"Talk to your business."

User examples:

"Spent ₹2500 on electricity today."

"Add 5 blue shirts to inventory."

"Who owes me money?"

"What was my profit this month?"

"How many blue shirts are left?"

"Show my best selling products."

==================================================
AI INTENT SYSTEM
==================================================

Do not make the AI just return fake text.

Create an action system.

Possible intents:

create_expense
create_order
update_inventory
get_profit
get_pending_payments
get_inventory
get_best_sellers

Example:

User:

"Spent ₹2500 on electricity."

AI parser returns:

{
  "intent": "create_expense",
  "amount": 2500,
  "category": "Electricity",
  "date": "today"
}

Then JavaScript calls:

createExpense()

Then Supabase inserts the expense.

Then AI responds:

"✅ ₹2,500 electricity expense recorded."

==================================================
AI FALLBACK MODE
==================================================

IMPORTANT:

The MVP must work even without an external AI API.

Create a simple rule-based parser.

Examples:

If message contains:

"spent"
"paid"
"expense"

→ detect expense.

If message contains:

"stock"
"add"
"inventory"

→ detect inventory.

If message contains:

"profit"

→ calculate profit.

If message contains:

"owe"
"pending payment"

→ show pending payments.

If message contains:

"blue shirt"
"order"
"need"

→ detect order.

This guarantees the hackathon demo works.

==================================================
SIMULATED WHATSAPP
==================================================

Create a realistic WhatsApp-style customer chat.

Do NOT integrate the real WhatsApp API.

Example:

Customer:

"I need 2 blue shirts size M."

AI:

"I found Blue Shirt, size M.
15 units are available."

Then:

Order Created

2 × ₹800

Total:
₹1,600

Automatically update:

Inventory:
15 → 13

Orders:
+1

Revenue:
+₹1,600

Create invoice.

Show success animation.

This must be the most polished part of the application.

==================================================
INSIGHTS
==================================================

Create Insights page.

Show:

Revenue Trend
Expense Trend
Profit Trend
Best Selling Products
Low Stock
Pending Payments
Inactive Customers

Add AI-style recommendations:

"Blue Shirt is your best-selling product."

"White T-Shirt is running low."

"You have ₹6,500 in pending payments."

"Delivery expenses increased this month."

These insights can initially be generated using JavaScript calculations.

==================================================
NAVIGATION
==================================================

Sidebar:

Dashboard
Orders
Inventory
Customers
Expenses
Payments
Invoices
AI Assistant
Insights
Settings

Sidebar should have icons.

Mobile:

Use hamburger menu.

==================================================
HACKATHON DEMO MODE
==================================================

Add a button:

🚀 Launch Demo

When clicked:

Load StyleHub demo data.

Add:

Reset Demo

The demo should always return to predictable initial data.

==================================================
MAIN DEMO FLOW
==================================================

The entire application must support this demo:

STEP 1:

Open Dashboard.

Show:

Revenue
Expenses
Profit
Orders
Pending Payments
Low Stock

STEP 2:

Open simulated WhatsApp.

Customer says:

"I need 2 blue shirts size M."

STEP 3:

AI understands the request.

STEP 4:

Create order:

2 × ₹800 = ₹1,600

STEP 5:

Inventory changes:

15 → 13

STEP 6:

Generate invoice.

STEP 7:

Open Business AI.

Owner says:

"Spent ₹2500 on electricity today."

AI:

"✅ Expense recorded."

STEP 8:

Ask:

"What is my profit this month?"

AI calculates from Supabase.

STEP 9:

Ask:

"Who owes me money?"

AI shows pending customers.

STEP 10:

Return to Dashboard.

Show updated values.

The final hackathon message:

"One conversation created a complete business workflow."

==================================================
RESPONSIVENESS
==================================================

The application must work on:

Desktop
Tablet
Mobile

Pay special attention to:

Dashboard
AI Chat
WhatsApp simulation
Tables
Forms

==================================================
ERROR HANDLING
==================================================

Implement:

Loading states
Error messages
Success messages
Empty states
Form validation

Use toast notifications.

==================================================
CODE QUALITY
==================================================

Use:

- Semantic HTML
- Modular JavaScript
- Reusable functions
- Clear naming
- Comments for important logic
- Async/await
- try/catch for Supabase calls

Do not duplicate code unnecessarily.

==================================================
ENVIRONMENT VARIABLES
==================================================

Create:

.env.example

With:

SUPABASE_URL=
SUPABASE_ANON_KEY=
AI_API_KEY=

IMPORTANT:

Never commit actual API keys.

==================================================
FINAL REQUIREMENTS
==================================================

Before declaring the project complete:

1. Test every navigation link.
2. Test Supabase connection.
3. Test authentication.
4. Test creating an order.
5. Test inventory update.
6. Test creating an expense.
7. Test profit calculation.
8. Test payment updates.
9. Test AI commands.
10. Test simulated WhatsApp flow.
11. Test invoice generation.
12. Test mobile responsiveness.
13. Fix all console errors.
14. Remove placeholder content.
15. Make the UI presentation-ready.

MOST IMPORTANT:

Do not create static mock screens only.

The MVP must have REAL Supabase CRUD operations.

The main demo must work end-to-end:

WhatsApp Message
↓
AI Intent
↓
Business Action
↓
Supabase
↓
Inventory / Order / Expense
↓
Dashboard Update

Build this as a polished hackathon MVP that can be demonstrated to judges in 3–5 minutes.