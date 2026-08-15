// ================================================================
// 🔑 REPLACE THESE TWO LINES WITH YOUR SUPABASE CREDENTIALS
// ================================================================
const SUPABASE_URL = "https://uqxehdkhhicwvifstkcu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxeGVoZGtoaGljd3ZpZnN0a2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTYxNzAsImV4cCI6MjEwMjAzMjE3MH0.8Ra-hN02vr1Q6uWMpTH1Wyergh6QeUri1UjlTLDcGPM";
// ================================================================

// =============================================================
// STATE & CLIENT
// =============================================================
let supabaseClient = null;
let currentUser = null;
let currentBusiness = null;
let chartInstances = {};
let currentPage = "landing";
let isLoggingOut = false;

// =============================================================
// TOAST
// =============================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    info: "fa-info-circle",
    warning: "fa-triangle-exclamation",
  };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// =============================================================
// SUPABASE INIT
// =============================================================
function initSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );

    updateConnectionStatus(false);
    return null;
  }

  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    updateConnectionStatus(true);

    console.log(" Supabase client initialized");

    return supabaseClient;
  } catch (e) {
    console.error("❌ Failed to init Supabase:", e);

    supabaseClient = null;
    updateConnectionStatus(false);

    return null;
  }
}

// =============================================================
// CONNECTION STATUS
// =============================================================
function updateConnectionStatus(connected) {
  const el = document.getElementById("connection-status");

  if (!el) return;

  if (connected) {
    el.className = "status-badge status-connected";

    el.innerHTML =
      '<i class="fas fa-link" style="font-size:1rem;"></i> Connected';
  } else {
    el.className = "status-badge status-disconnected";

    el.innerHTML =
      '<i class="fas fa-unlink" style="font-size:1rem;"></i> Disconnected';
  }
}

// =============================================================
// SIGN UP
// =============================================================
async function signUp(email, password, businessName) {
  const signup_btn = document.getElementById("Signup_form_btn");
  signup_btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

  const client = initSupabase();

  if (!client) {
    showToast("❌ Supabase not configured. Check your credentials.", "error");
    return;
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName || "My Business",
        },
      },
    });

    if (error) {
      throw error;
    }

    console.log("Signup response:", data);

    /*
     * If email confirmation is enabled,
     * Supabase will return no session.
     */
    if (!data.session) {
      showToast(
        " Account created! Please check your email to confirm.",
        "success",
      );

      showAuthForm("login");

      return;
    }

    /*
     * If email confirmation is disabled,
     * the user will already have a session.
     */
    currentUser = data.user;

    await loadBusiness();

    enterApp();

    showToast(" Account created successfully!", "success");
  } catch (e) {
    console.error("Signup error:", e);

    showToast("❌ " + e.message, "error");
  }
  signup_btn.innerHTML = `<i class="fas fa-arrow-right"></i> Try Again`;
}

// =============================================================
// SIGN IN
// =============================================================
async function signIn(email, password) {
  const login_btn = document.getElementById("Login_form_btn");
  login_btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

  const client = initSupabase();

  if (!client) {
    showToast("❌ Supabase not configured. Check your credentials.", "error");
    return;
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.session || !data.user) {
      throw new Error("Login succeeded but no session was created.");
    }

    currentUser = data.user;

    await loadBusiness();

    enterApp();

    showToast(" Welcome back!", "success");
  } catch (e) {
    console.error("Sign in error:", e);

    showToast("❌ " + e.message, "error");
  }
  login_btn.innerHTML = `<i class="fas fa-arrow-right"></i> Try Again`;
}

// =============================================================
// LOAD BUSINESS
// =============================================================
async function loadBusiness() {
  const client = initSupabase();

  if (!client || !currentUser) {
    return;
  }

  try {
    const { data, error } = await client
      .from("businesses")
      .select("*")
      .eq("owner_id", currentUser.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (data) {
      currentBusiness = data;
    } else {
      const bizName = currentUser.user_metadata?.business_name || "My Business";

      const { data: newBiz, error: createError } = await client
        .from("businesses")
        .insert({
          name: bizName,
          type: "Retail",
          owner_id: currentUser.id,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      currentBusiness = newBiz;
    }

    const businessName = document.getElementById("settings-business-name");

    const contactNumber = document.getElementById("settings-contact-number");

    const businessType = document.getElementById("settings-business-type");

    if (businessName) {
      businessName.value = currentBusiness?.name || "";
    }

    if (contactNumber) {
      contactNumber.value = currentBusiness?.wa_phone_number_id || "";
    }

    if (businessType) {
      businessType.value = currentBusiness?.type || "";
    }
  } catch (e) {
    console.error("Load business error:", e);

    showToast("Error loading business: " + e.message, "error");
  }
}

// =============================================================
// LOGOUT
// =============================================================
async function handleLogout() {
  console.log("🔐 Logging out...");

  // Clear Supabase's locally persisted auth session
  const client = initSupabase();

  try {
    if (client?.auth?.storage) {
      const storageKey = "sb-uqxehdkhhicwvifstkcu-auth-token";

      await client.auth.storage.removeItem(storageKey);

      console.log(" Local Supabase session removed");
    }
  } catch (e) {
    console.warn("Local session cleanup:", e);
  }

  // Clear application state
  currentUser = null;
  currentBusiness = null;

  // Go to landing page
  navigateTo("landing");

  showToast("Logged out successfully", "info");

  // Optional: reload so no stale in-memory auth state remains
  setTimeout(() => {
    window.location.reload();
  }, 300);
}

// =============================================================
// GET SUPABASE CLIENT
// =============================================================
function getClient() {
  const client = initSupabase();

  if (!client) {
    throw new Error("Supabase not configured. Check your credentials.");
  }

  return client;
}

// ---- Products ----
async function getProducts() {
  const client = getClient();
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("business_id", currentBusiness.id)
    .order("name");
  if (error) throw error;
  return data || [];
}
async function addProduct(product) {
  const client = getClient();
  const { data, error } = await client
    .from("products")
    .insert({ ...product, business_id: currentBusiness.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}
async function updateProduct(id, updates) {
  const client = getClient();
  const { data, error } = await client
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
async function deleteProduct(id) {
  const client = getClient();
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ---- Customers ----
async function getCustomers() {
  const client = getClient();
  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("business_id", currentBusiness.id)
    .order("name");
  if (error) throw error;
  return data || [];
}
async function addCustomer(customer) {
  const client = getClient();
  const { data, error } = await client
    .from("customers")
    .insert({
      ...customer,
      business_id: currentBusiness.id,
      total_orders: 0,
      total_spending: 0,
      pending_payment: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
async function updateCustomer(id, updates) {
  const client = getClient();
  const { data, error } = await client
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Orders ----
async function getOrders() {
  const client = getClient();
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("business_id", currentBusiness.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
async function addOrder(order) {
  const client = getClient();
  const { data, error } = await client
    .from("orders")
    .insert({ ...order, business_id: currentBusiness.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}
async function updateOrder(id, updates) {
  const client = getClient();
  const { data, error } = await client
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Expenses ----
async function getExpenses() {
  const client = getClient();
  const { data, error } = await client
    .from("expenses")
    .select("*")
    .eq("business_id", currentBusiness.id)
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data || [];
}
async function addExpense(expense) {
  const client = getClient();
  const { data, error } = await client
    .from("expenses")
    .insert({ ...expense, business_id: currentBusiness.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Payments ----
async function getPayments() {
  const client = getClient();
  const { data, error } = await client
    .from("payments")
    .select("*")
    .eq("business_id", currentBusiness.id);
  if (error) throw error;
  return data || [];
}
async function addPayment(payment) {
  const client = getClient();
  const { data, error } = await client
    .from("payments")
    .insert({ ...payment, business_id: currentBusiness.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}
async function updatePayment(id, updates) {
  const client = getClient();
  const { data, error } = await client
    .from("payments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Invoices ----
async function getInvoices() {
  const client = getClient();
  const { data, error } = await client
    .from("invoices")
    .select("*")
    .eq("business_id", currentBusiness.id);
  if (error) throw error;
  return data || [];
}
async function addInvoice(invoice) {
  const client = getClient();
  const { data, error } = await client
    .from("invoices")
    .insert({ ...invoice, business_id: currentBusiness.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}
async function updateInvoice(id, updates) {
  const client = getClient();
  const { data, error } = await client
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =============================================================
// STATS
// =============================================================
async function getStats() {
  const [products, customers, orders, expenses, payments] = await Promise.all([
    getProducts(),
    getCustomers(),
    getOrders(),
    getExpenses(),
    getPayments(),
  ]);
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const pendingPayments = payments
    .filter((p) => p.status === "Pending")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const lowStock = products.filter(
    (p) => (p.stock || 0) <= (p.minimum_stock || 0),
  ).length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter((c) => {
    if (!c.last_order_date) return false;
    const d = new Date(c.last_order_date);
    return d >= thirtyDaysAgo;
  }).length;
  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    orders: orders.length,
    newCustomers,
    pendingPayments,
    lowStock,
    ordersList: orders,
    products,
    customers,
    expenses,
    payments,
  };
}

// =============================================================
// DASHBOARD
// =============================================================
async function updateDashboard() {
  try {
    const stats = await getStats();
    const elements = {
      revenue: document.getElementById("stat-revenue"),
      expenses: document.getElementById("stat-expenses"),
      profit: document.getElementById("stat-profit"),
      orders: document.getElementById("stat-orders"),
      newCustomers: document.getElementById("stat-new-customers"),
      pendingPayments: document.getElementById("stat-pending-payments"),
      lowStock: document.getElementById("stat-low-stock"),
    };
    if (elements.revenue)
      elements.revenue.textContent = "₹" + stats.totalRevenue.toLocaleString();
    if (elements.expenses)
      elements.expenses.textContent =
        "₹" + stats.totalExpenses.toLocaleString();
    if (elements.profit) {
      elements.profit.textContent = "₹" + stats.netProfit.toLocaleString();
      elements.profit.className =
        "value " + (stats.netProfit >= 0 ? "green" : "red");
    }
    if (elements.orders) elements.orders.textContent = stats.orders;
    if (elements.newCustomers)
      elements.newCustomers.textContent = stats.newCustomers;
    if (elements.pendingPayments)
      elements.pendingPayments.textContent =
        "₹" + stats.pendingPayments.toLocaleString();
    if (elements.lowStock) elements.lowStock.textContent = stats.lowStock;

    const recentContainer = document.getElementById("dashboard-recent-orders");
    if (recentContainer) {
      const recent = stats.ordersList.slice(0, 5);
      if (recent.length === 0) {
        recentContainer.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><h4>No orders yet</h4><p>Create your first order to see it here.</p></div>`;
      } else {
        let html = `<div class="table-wrap"><table>
                            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead><tbody>`;
        recent.forEach((o) => {
          const statusBadge =
            o.status === "Delivered"
              ? "badge-green"
              : o.status === "Cancelled"
                ? "badge-red"
                : o.status === "New"
                  ? "badge-blue"
                  : "badge-gray";
          const payBadge =
            o.payment_status === "Paid"
              ? "badge-green"
              : o.payment_status === "Pending"
                ? "badge-yellow"
                : "badge-blue";
          html += `<tr>
                                <td><strong>#${(o.id || "").slice(-4)}</strong></td>
                                <td>${o.customer_name || "—"}</td>
                                <td><strong>₹${(o.total_amount || 0).toLocaleString()}</strong></td>
                                <td><span class="badge ${statusBadge}">${o.status || "New"}</span></td>
                                <td><span class="badge ${payBadge}">${o.payment_status || "Pending"}</span></td>
                              </tr>`;
        });
        html += `</tbody></table></div>`;
        recentContainer.innerHTML = html;
      }
    }
    renderCharts(stats);
  } catch (e) {
    console.error("Dashboard error:", e);
  }
}

// =============================================================
// CHARTS
// =============================================================
function renderCharts(stats) {
  const ctx1 = document.getElementById("revenue-chart");
  if (ctx1) {
    if (chartInstances.revenue) chartInstances.revenue.destroy();
    const labels = [];
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(
        d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      );
      const dayOrders = stats.ordersList.filter((o) => {
        if (!o.created_at) return false;
        const od = new Date(o.created_at);
        return od.toDateString() === d.toDateString();
      });
      data.push(dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0));
    }
    chartInstances.revenue = new Chart(ctx1, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Revenue",
            data,
            borderColor: "#25D366",
            backgroundColor: "rgba(37,211,102,0.1)",
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#25D366",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" } },
          x: { grid: { display: false } },
        },
      },
    });
  }
  const ctx2 = document.getElementById("expense-chart");
  if (ctx2) {
    if (chartInstances.expense) chartInstances.expense.destroy();
    const catMap = {};
    stats.expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0);
    });
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const colors = [
      "#25D366",
      "#3B82F6",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
    ];
    chartInstances.expense = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, padding: 12 },
          },
        },
      },
    });
  }
}

// =============================================================
// RENDER TABLES (Orders, Inventory, Customers, Expenses, Payments, Invoices)
// =============================================================
async function renderOrders() {
  const container = document.getElementById("orders-table-container");
  container.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h4>Loading orders...</h4></div>';
  if (!container) return;
  try {
    const orders = await getOrders();
    if (orders.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><h4>No orders yet</h4><p>Create your first order to get started.</p></div>`;
      return;
    }
    let html = `<div class="table-wrap"><table>
                    <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>`;
    orders.forEach((o) => {
      const items = (o.items || [])
        .map((i) => `${i.product_name} ×${i.quantity}`)
        .join(", ");
      const payBadge =
        o.payment_status === "Paid"
          ? "badge-green"
          : o.payment_status === "Pending"
            ? "badge-yellow"
            : "badge-blue";
      const statusBadge =
        o.status === "Delivered"
          ? "badge-green"
          : o.status === "Cancelled"
            ? "badge-red"
            : o.status === "New"
              ? "badge-blue"
              : "badge-gray";
      html += `<tr>
                        <td><strong>#${(o.id || "").slice(-4)}</strong></td>
                        <td>${o.customer_name || "—"}</td>
                        <td style="font-size:0.85rem;">${items || "—"}</td>
                        <td><strong>₹${(o.total_amount || 0).toLocaleString()}</strong></td>
                        <td><span class="badge ${payBadge}">${o.payment_status || "Pending"}</span></td>
                        <td><span class="badge ${statusBadge}">${o.status || "New"}</span></td>
                        <td style="font-size:0.8rem;color:var(--gray-500);">${o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td>
                        <td>
                          <button class="btn btn-primary btn-xs" onclick="viewOrder('${o.id}')">View</button>
                          <button class="btn btn-success btn-xs" onclick="updateOrderStatus('${o.id}','Delivered')">Deliver</button>
                        </td>
                      </tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading orders</h4></div>`;
  }
}

async function renderInventory() {
  const container = document.getElementById("inventory-table-container");
  container.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h4>Loading Inventory...</h4></div>';
  if (!container) return;
  try {
    const products = await getProducts();
    if (products.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-boxes"></i><h4>No products</h4><p>Add your first product to start managing inventory.</p></div>`;
      return;
    }
    let html = `<div class="table-wrap"><table>
                    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th><th>Min</th><th>Status</th></tr></thead><tbody>`;
    products.forEach((p) => {
      const stock = p.stock || 0;
      const min = p.minimum_stock || 0;
      const status =
        stock <= 0 ? "OUT OF STOCK" : stock <= min ? "LOW STOCK" : "IN STOCK";
      const badge =
        stock <= 0
          ? "badge-red"
          : stock <= min
            ? "badge-yellow"
            : "badge-green";
      html += `<tr>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.category || "—"}</td>
                        <td>₹${p.price || 0}</td>
                        <td>₹${p.cost_price || p.price || 0}</td>
                        <td><strong>${stock}</strong></td>
                        <td>${min}</td>
                        <td><span class="badge ${badge}">${status}</span></td>
                      </tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading inventory</h4></div>`;
  }
}

async function renderInvoices() {
  const container = document.getElementById("invoices-container");

  if (!container) return;

  container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <h4>Loading invoices...</h4>
        </div>
    `;

  try {
    const invoices = await getInvoices();

    if (!invoices || invoices.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <h4>No invoices yet</h4>
                    <p>Invoices will appear here when you create orders.</p>
                </div>
            `;
      return;
    }

    let html = `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Order</th>
                            <th>Subtotal</th>
                            <th>Tax</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    invoices.forEach((invoice) => {
      const statusBadge =
        invoice.status === "Paid"
          ? "badge-green"
          : invoice.status === "Cancelled"
            ? "badge-red"
            : "badge-yellow";

      html += `
                <tr>
                    <td>
                        <strong>${invoice.invoice_number || "—"}</strong>
                    </td>

                    <td>
                        #${(invoice.order_id || "").slice(-4) || "—"}
                    </td>

                    <td>
                        ₹${Number(invoice.subtotal || 0).toLocaleString("en-IN")}
                    </td>

                    <td>
                        ₹${Number(invoice.tax || 0).toLocaleString("en-IN")}
                    </td>

                    <td>
                        <strong>
                            ₹${Number(invoice.total || 0).toLocaleString("en-IN")}
                        </strong>
                    </td>

                    <td>
                        <span class="badge ${statusBadge}">
                            ${invoice.status || "Pending"}
                        </span>
                    </td>

                    <td>
                        ${
                          invoice.created_at
                            ? new Date(invoice.created_at).toLocaleDateString(
                                "en-IN",
                              )
                            : "—"
                        }
                    </td>

                    <td>
                        <button
                            class="btn btn-primary btn-xs"
                            onclick="viewInvoice('${invoice.id}')">
                            View
                        </button>

                    </td>
                </tr>
            `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        `;

    container.innerHTML = html;
  } catch (e) {
    console.error("Invoices error:", e);

    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error loading invoices</h4>
            </div>
        `;
  }
}

async function renderCustomers() {
  const container = document.getElementById("customers-table-container");
  container.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h4>Loading Customers...</h4></div>';
  if (!container) return;
  try {
    const customers = await getCustomers();
    if (customers.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><h4>No customers</h4><p>Add customers as they place orders.</p></div>`;
      return;
    }
    let html = `<div class="table-wrap"><table>
                    <thead><tr><th>Name</th><th>Phone</th><th>Orders</th><th>Spending</th><th>Pending</th><th>Last Order</th></tr></thead><tbody>`;
    customers.forEach((c) => {
      html += `<tr>
                        <td><strong>${c.name}</strong></td>
                        <td>${c.phone || "—"}</td>
                        <td>${c.total_orders || 0}</td>
                        <td>₹${(c.total_spending || 0).toLocaleString()}</td>
                        <td>${c.pending_payment > 0 ? "₹" + c.pending_payment.toLocaleString() : "—"}</td>
                        <td style="font-size:0.8rem;color:var(--gray-500);">${c.last_order_date || "—"}</td>
                      </tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading customers</h4></div>`;
  }
}

async function renderExpenses() {
  const container = document.getElementById("expenses-table-container");
  container.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h4>Loading Expenses...</h4></div>';
  if (!container) return;
  try {
    const expenses = await getExpenses();
    if (expenses.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-coins"></i><h4>No expenses</h4><p>Track your expenses here.</p></div>`;
      return;
    }
    let html = `<div class="table-wrap"><table>
                    <thead><tr><th>Category</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead><tbody>`;
    expenses.forEach((e) => {
      html += `<tr>
                        <td><span class="badge badge-blue">${e.category || "Other"}</span></td>
                        <td><strong>₹${(e.amount || 0).toLocaleString()}</strong></td>
                        <td style="font-size:0.9rem;">${e.description || "—"}</td>
                        <td style="font-size:0.8rem;color:var(--gray-500);">${e.expense_date || "—"}</td>
                      </tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading expenses</h4></div>`;
  }
}

async function renderPayments() {
  const container = document.getElementById("payments-table-container");
  container.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h4>Loading Payments...</h4></div>';
  if (!container) return;
  try {
    const payments = await getPayments();
    if (payments.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-hand-holding-usd"></i><h4>No payments</h4><p>Payment records will appear here.</p></div>`;
      return;
    }
    let html = `<div class="table-wrap"><table>
                    <thead><tr><th>Customer</th><th>Amount</th><th>Status</th><th>Order</th><th>Action</th></tr></thead><tbody>`;
    payments.forEach((p) => {
      const badge =
        p.status === "Paid"
          ? "badge-green"
          : p.status === "Pending"
            ? "badge-yellow"
            : "badge-blue";
      html += `<tr>
                        <td><strong>${p.customer_name}</strong></td>
                        <td>₹${(p.amount || 0).toLocaleString()}</td>
                        <td><span class="badge ${badge}">${p.status || "Pending"}</span></td>
                        <td style="font-size:0.8rem;">#${p.order_id ? p.order_id.slice(-4) : "—"}</td>
                        <td>
                          ${p.status === "Pending" ? `<button class="btn btn-success btn-xs" onclick="markPaymentPaid('${p.id}')">Mark Paid</button>` : "—"}
                        </td>
                      </tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading payments</h4></div>`;
  }
}

// =============================================================
// INVOICE ACTIONS
// =============================================================

async function viewInvoice(id) {
  try {
    const invoices = await getInvoices();
    const inv = invoices.find((i) => i.id === id);

    if (!inv) {
      showToast("Invoice not found", "error");
      return;
    }

    const orders = await getOrders();
    const order = orders.find((o) => o.id === inv.order_id);

    if (!order) {
      showToast("Order linked to this invoice was not found", "error");
      return;
    }

    const customer = order.customer_name || "Walk-in Customer";
    const items = Array.isArray(order.items) ? order.items : [];
    const businessName = currentBusiness?.name || "My Business";

    const invoiceDate = inv.created_at
      ? new Date(inv.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN");

    const orderId = order.id ? order.id.slice(-4).toUpperCase() : "—";

    const status = inv.status || "Pending";

    const statusClass =
      status === "Paid"
        ? "invoice-status-paid"
        : status === "Pending"
          ? "invoice-status-pending"
          : "invoice-status-other";

    const itemsHtml = items.length
      ? items
          .map((item, index) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            const total = qty * price;

            return `
                    <tr>
                        <td class="invoice-item-number">${index + 1}</td>

                        <td class="invoice-product">
                            <strong>${escapeHtml(item.product_name || "Product")}</strong>
                        </td>

                        <td class="invoice-qty">
                            ${qty}
                        </td>

                        <td class="invoice-price">
                            ₹${price.toLocaleString("en-IN")}
                        </td>

                        <td class="invoice-amount">
                            ₹${total.toLocaleString("en-IN")}
                        </td>
                    </tr>
                `;
          })
          .join("")
      : `
                <tr>
                    <td colspan="5" class="invoice-empty-items">
                        <i class="fas fa-box-open"></i>
                        <span>No items found</span>
                    </td>
                </tr>
            `;

    openModal(
      `Invoice ${inv.invoice_number}`,
      `
            <div class="invoice-modal">

                <!-- Invoice Paper -->
                <div class="invoice-paper" id="print-invoice-${inv.id}">

                    <!-- Top Header -->
                    <div class="invoice-top">

                        <div class="invoice-brand">
                            <div class="invoice-brand-icon">
                                <h2>${escapeHtml(businessName).charAt(0).toUpperCase()}</h2>
                            </div>

                            <div>
                                <h2>${escapeHtml(businessName)}</h2>
                                <p>Business Invoice</p>
                            </div>
                        </div>

                        <div class="invoice-heading">
                            <span>INVOICE</span>
                            <strong>${escapeHtml(inv.invoice_number || "INV-000")}</strong>
                        </div>

                    </div>

                    <div class="invoice-line"></div>

                    <!-- Invoice Information -->
                    <div class="invoice-info-grid">

                        <div class="invoice-info-box">
                            <span class="invoice-label">
                                <i class="fas fa-user"></i>
                                BILL TO
                            </span>

                            <strong>${escapeHtml(customer)}</strong>

                            ${
                              order.customer_id
                                ? `
                                <small>Customer</small>
                            `
                                : ""
                            }
                        </div>

                        <div class="invoice-info-box">
                            <span class="invoice-label">
                                <i class="fas fa-calendar"></i>
                                INVOICE DATE
                            </span>

                            <strong>${invoiceDate}</strong>
                        </div>

                        <div class="invoice-info-box">
                            <span class="invoice-label">
                                <i class="fas fa-receipt"></i>
                                ORDER ID
                            </span>

                            <strong>#${orderId}</strong>
                        </div>

                        <div class="invoice-info-box">
                            <span class="invoice-label">
                                <i class="fas fa-circle-check"></i>
                                PAYMENT STATUS
                            </span>

                            <span class="invoice-status ${statusClass}">
                                <i class="fas ${
                                  status === "Paid" ? "fa-check" : "fa-clock"
                                }"></i>
                                ${escapeHtml(status)}
                            </span>
                        </div>

                    </div>

                    <!-- Items -->
                    <div class="invoice-items-section">

                        <div class="invoice-section-title">
                            <div>
                                <h3>Order Items</h3>
                                <span>${items.length} item${items.length !== 1 ? "s" : ""}</span>
                            </div>
                        </div>

                        <div class="invoice-table-wrap">

                            <table class="invoice-table">

                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>PRODUCT</th>
                                        <th>QTY</th>
                                        <th>PRICE</th>
                                        <th>AMOUNT</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${itemsHtml}
                                </tbody>

                            </table>

                        </div>

                    </div>

                    <!-- Bottom Summary -->
                    <div class="invoice-bottom">

                        <div class="invoice-note">
                            <div class="invoice-note-icon">
                                <i class="fas fa-heart"></i>
                            </div>

                            <div>
                                <strong>Thank you for your business!</strong>
                                <p>
                                    We appreciate your trust and support.
                                </p>
                            </div>
                        </div>

                        <div class="invoice-summary">

                            <div class="invoice-summary-row">
                                <span>Subtotal</span>
                                <strong>
                                    ₹${Number(inv.subtotal || 0).toLocaleString("en-IN")}
                                </strong>
                            </div>

                            <div class="invoice-summary-row">
                                <span>Tax</span>
                                <strong>
                                    ₹${Number(inv.tax || 0).toLocaleString("en-IN")}
                                </strong>
                            </div>

                            <div class="invoice-total-row">
                                <span>Total</span>

                                <strong>
                                    ₹${Number(inv.total || 0).toLocaleString("en-IN")}
                                </strong>
                            </div>

                        </div>

                    </div>

                    <!-- Footer -->
                    <div class="invoice-footer">

                        <span>
                            <i class="fas fa-shield-halved"></i>
                            This is a computer-generated invoice.
                        </span>

                        <span>
                            Generated ${new Date().toLocaleDateString("en-IN")}
                        </span>

                    </div>

                </div>

                <!-- Actions -->
                <div class="invoice-modal-actions no-print">

                    <button
                        class="btn btn-primary"
                        onclick="printInvoice('${inv.id}')">
                        <i class="fas fa-print"></i>
                        Print Invoice
                    </button>

                    <button
                        class="btn btn-outline"
                        onclick="downloadInvoice('${inv.id}')">
                        <i class="fas fa-download"></i>
                        Save / PDF
                    </button>

                    <button
                        class="btn btn-outline"
                        onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>

                </div>

            </div>
        `,
    );
  } catch (e) {
    console.error("Invoice error:", e);
    showToast("Failed to load invoice: " + e.message, "error");
  }
}

// Escape HTML to prevent broken invoice markup
function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Print only the invoice
function printInvoice(id) {
  const invoice = document.getElementById(`print-invoice-${id}`);

  if (!invoice) {
    showToast("Invoice not found", "error");
    return;
  }

  window.print();
}

// Browser print dialog can save as PDF
function downloadInvoice(id) {
  const invoice = document.getElementById(`print-invoice-${id}`);

  if (!invoice) {
    showToast("Invoice not found", "error");
    return;
  }

  window.print();
}

// =============================================================
// INSIGHTS
// =============================================================
async function renderInsights() {
  const container = document.getElementById("insights-container");
  container.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h4>Loading Insights...</h4></div>';
  if (!container) return;
  try {
    const stats = await getStats();
    const products = stats.products;
    const payments = stats.payments;
    const orders = stats.ordersList;
    const customers = stats.customers;
    const insights = [];
    insights.push({
      icon: "fa-chart-line",
      text: `Your <strong>net profit</strong> is ₹${stats.netProfit.toLocaleString()} with revenue of ₹${stats.totalRevenue.toLocaleString()} and expenses of ₹${stats.totalExpenses.toLocaleString()}.`,
      type: stats.netProfit > 0 ? "positive" : "warning",
    });
    const productSales = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.product_name;
        if (!productSales[key]) productSales[key] = 0;
        productSales[key] += item.quantity || 0;
      });
    });
    const sellers = Object.entries(productSales).sort((a, b) => b[1] - a[1]);
    if (sellers.length > 0) {
      insights.push({
        icon: "fa-crown",
        text: `<strong>${sellers[0][0]}</strong> is your best-selling product with ${sellers[0][1]} units sold.`,
        type: "positive",
      });
    }
    const low = products.filter(
      (p) => (p.stock || 0) <= (p.minimum_stock || 0),
    );
    if (low.length > 0) {
      insights.push({
        icon: "fa-exclamation-triangle",
        text: `<strong>${low.length} products</strong> are running low: ${low.map((p) => p.name).join(", ")}.`,
        type: "warning",
      });
    } else if (products.length > 0) {
      insights.push({
        icon: "fa-check-circle",
        text: "All products are well-stocked. Good job!",
        type: "positive",
      });
    }
    const pending = payments.filter((p) => p.status === "Pending");
    const pendingTotal = pending.reduce((s, p) => s + (p.amount || 0), 0);
    if (pendingTotal > 0) {
      insights.push({
        icon: "fa-hand-holding-usd",
        text: `You have <strong>₹${pendingTotal.toLocaleString()}</strong> in pending payments from ${pending.length} customers.`,
        type: "warning",
      });
    } else if (payments.length > 0) {
      insights.push({
        icon: "fa-check-circle",
        text: "No pending payments. All customers are up to date!",
        type: "positive",
      });
    }
    if (orders.length > 0) {
      insights.push({
        icon: "fa-clipboard-list",
        text: `You have <strong>${orders.length} orders</strong> in total. ${orders.filter((o) => o.status === "Delivered").length} delivered, ${orders.filter((o) => o.status === "New").length} new.`,
        type: "info",
      });
    }
    if (customers.length > 0) {
      const topSpender = customers.reduce((a, b) =>
        (a.total_spending || 0) > (b.total_spending || 0) ? a : b,
      );
      if (topSpender && topSpender.total_spending > 0) {
        insights.push({
          icon: "fa-user-tie",
          text: `<strong>${topSpender.name}</strong> is your top spender with ₹${(topSpender.total_spending || 0).toLocaleString()} in total purchases.`,
          type: "positive",
        });
      }
    }
    if (insights.length === 0) {
      insights.push({
        icon: "fa-info-circle",
        text: "Start adding data to see insights about your business.",
        type: "info",
      });
    }
    container.innerHTML = insights
      .map(
        (ins) => `
                    <div class="insight-card" style="border-left-color: ${ins.type === "positive" ? "var(--primary)" : ins.type === "warning" ? "#F59E0B" : "#3B82F6"};">
                      <div style="display:flex;align-items:flex-start;gap:12px;">
                        <div class="icon"><i class="fas ${ins.icon}"></i></div>
                        <div class="text">${ins.text}</div>
                      </div>
                    </div>
                  `,
      )
      .join("");
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading Insights</h4></div>`;
  }
}

// =============================================================
// AI INTENT PARSER & EXECUTOR
// =============================================================
function parseIntent(text) {
  const lower = text.toLowerCase().trim();
  if (/(spent|paid|expense|cost|spend)/i.test(lower) && /\d+/.test(lower)) {
    const amountMatch = lower.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1]) : 0;
    let category = "Other";
    if (/(electricity|power|light)/i.test(lower)) category = "Electricity";
    else if (/(rent)/i.test(lower)) category = "Rent";
    else if (/(salary|staff|employee)/i.test(lower)) category = "Salary";
    else if (/(delivery|shipping|logistics)/i.test(lower))
      category = "Delivery";
    else if (/(marketing|ads|promotion)/i.test(lower)) category = "Marketing";
    else if (/(packaging|box|wrap)/i.test(lower)) category = "Packaging";
    else if (/(inventory|stock|supply)/i.test(lower)) category = "Inventory";
    return {
      intent: "create_expense",
      amount,
      category,
      description: text,
    };
  }
  if (
    /(add|restock|increase).*?(stock|inventory)/i.test(lower) &&
    /\d+/.test(lower)
  ) {
    const amountMatch = lower.match(/(\d+)/);
    const qty = amountMatch ? parseInt(amountMatch[1]) : 1;
    return { intent: "update_inventory", quantity: qty, action: "add" };
  }
  if (/(profit|earnings|net|how much (did|have|is))/i.test(lower)) {
    return { intent: "get_profit" };
  }
  if (/(owe|pending|due|who owes|payment pending)/i.test(lower)) {
    return { intent: "get_pending_payments" };
  }
  if (/(stock|inventory|left|available|how many)/i.test(lower)) {
    return { intent: "get_inventory" };
  }
  if (/(best seller|top selling|popular|bestseller)/i.test(lower)) {
    return { intent: "get_best_sellers" };
  }
  if (
    /(order|need|want|buy|get).*?\d+.*?(shirt|jeans|tshirt|hoodie|pants|top)/i.test(
      lower,
    )
  ) {
    const amountMatch = lower.match(/(\d+)/);
    const qty = amountMatch ? parseInt(amountMatch[1]) : 1;
    return {
      intent: "create_order",
      quantity: qty,
      customer_name: "Customer",
    };
  }
  return { intent: "unknown" };
}

async function executeIntent(parsed) {
  const { intent } = parsed;
  if (intent === "create_expense") {
    const expense = {
      category: parsed.category || "Other",
      amount: parsed.amount || 0,
      description: parsed.description || "Expense recorded",
      expense_date: new Date().toISOString().slice(0, 10),
    };
    await addExpense(expense);
    return {
      success: true,
      message: ` ₹${expense.amount} ${expense.category} expense recorded.`,
    };
  }
  if (intent === "update_inventory") {
    const products = await getProducts();
    if (products.length === 0)
      return { success: false, message: `❌ No products found.` };
    const product = products[0];
    const delta = parsed.action === "add" ? parsed.quantity : -parsed.quantity;
    const newStock = Math.max(0, (product.stock || 0) + delta);
    await updateProduct(product.id, { stock: newStock });
    return {
      success: true,
      message: `📦 ${product.name} stock updated to ${newStock}.`,
    };
  }
  if (intent === "get_profit") {
    const stats = await getStats();
    return {
      success: true,
      message: `📊 Your net profit is ₹${stats.netProfit.toLocaleString()} (Revenue: ₹${stats.totalRevenue.toLocaleString()} - Expenses: ₹${stats.totalExpenses.toLocaleString()})`,
    };
  }
  if (intent === "get_pending_payments") {
    const payments = await getPayments();
    const pending = payments.filter((p) => p.status === "Pending");
    if (pending.length === 0)
      return { success: true, message: ` No pending payments.` };
    const list = pending
      .map((p) => `${p.customer_name}: ₹${p.amount}`)
      .join(", ");
    const total = pending.reduce((s, p) => s + (p.amount || 0), 0);
    return {
      success: true,
      message: `💳 Pending payments: ${list}. Total: ₹${total.toLocaleString()}`,
    };
  }
  if (intent === "get_inventory") {
    const products = await getProducts();
    if (products.length === 0)
      return { success: true, message: `📦 No products in inventory.` };
    const list = products.map((p) => `${p.name}: ${p.stock || 0}`).join(", ");
    return { success: true, message: `📦 Inventory: ${list}` };
  }
  if (intent === "get_best_sellers") {
    const orders = await getOrders();
    const sales = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.product_name;
        if (!sales[key]) sales[key] = 0;
        sales[key] += item.quantity || 0;
      });
    });
    const sellers = Object.entries(sales).sort((a, b) => b[1] - a[1]);
    if (sellers.length === 0)
      return { success: true, message: "📊 No sales data yet." };
    const list = sellers
      .slice(0, 3)
      .map((s) => `${s[0]} (${s[1]} sold)`)
      .join(", ");
    return { success: true, message: `🏆 Best sellers: ${list}` };
  }
  if (intent === "create_order") {
    const products = await getProducts();
    if (products.length === 0)
      return { success: false, message: `❌ No products available.` };
    const product = products[0];
    const qty = parsed.quantity || 1;
    if ((product.stock || 0) < qty) {
      return {
        success: false,
        message: `❌ Only ${product.stock || 0} units of ${product.name} available.`,
      };
    }
    let customers = await getCustomers();
    let customer = customers.find(
      (c) =>
        c.name.toLowerCase() ===
        (parsed.customer_name || "customer").toLowerCase(),
    );
    if (!customer) {
      customer = await addCustomer({
        name: parsed.customer_name || "Walk-in Customer",
        phone: "",
        email: "",
      });
    }
    const total = (product.price || 0) * qty;
    const order = {
      customer_id: customer.id,
      customer_name: customer.name,
      total_amount: total,
      status: "New",
      payment_status: "Pending",
      items: [
        {
          product_name: product.name,
          quantity: qty,
          price: product.price || 0,
        },
      ],
    };
    const newOrder = await addOrder(order);
    await updateProduct(product.id, {
      stock: Math.max(0, (product.stock || 0) - qty),
    });
    const invoices = await getInvoices();
    await addInvoice({
      order_id: newOrder.id,
      invoice_number: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      subtotal: total,
      tax: 0,
      total: total,
      status: "Pending",
    });
    await addPayment({
      customer_name: customer.name,
      amount: total,
      status: "Pending",
      order_id: newOrder.id,
    });
    await updateCustomer(customer.id, {
      total_orders: (customer.total_orders || 0) + 1,
      total_spending: (customer.total_spending || 0) + total,
      pending_payment: (customer.pending_payment || 0) + total,
      last_order_date: new Date().toISOString().slice(0, 10),
    });
    return {
      success: true,
      message: ` Order created! ${qty} × ${product.name} = ₹${total.toLocaleString()}. Inventory updated.`,
    };
  }
  return {
    success: false,
    message: `🤔 I'm not sure how to help with that. Try: "Spent ₹2500 on electricity" or "Who owes me money?"`,
  };
}

// =============================================================
// AI RESPONSE HELPERS
// =============================================================

function escapeAIHtml(text) {
  if (text === null || text === undefined) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAIResponse(text) {
  let html = escapeAIHtml(text);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bullet points
  html = html.replace(/^\s*[-•]\s+(.+)$/gm, "• $1");

  // New lines
  html = html.replace(/\n/g, "<br>");

  return html;
}

// =============================================================
// AI CHAT SETUP
// =============================================================

// =============================================================
// GEMINI AI ASSISTANT
// =============================================================

let aiConversationHistory = [];

async function setupAIChat() {
  const messages = document.getElementById("ai-chat-messages");
  const input = document.getElementById("ai-chat-input");
  const sendBtn = document.getElementById("ai-chat-send");

  if (!messages || !input || !sendBtn) return;

  // ---------------------------------------------------------
  // Prevent duplicate initialization
  // ---------------------------------------------------------

  if (messages.dataset.initialized === "true") {
    return;
  }

  messages.dataset.initialized = "true";

  // ---------------------------------------------------------
  // Welcome message
  // ---------------------------------------------------------

  const welcome = document.createElement("div");

  welcome.className = "chat-msg bot";

  welcome.innerHTML = `
        👋 Hi! I'm your <strong>Business AI</strong>.

        <br><br>

        I can help you understand:

        <br>
        📊 Revenue & profit
        <br>
        📦 Inventory
        <br>
        💰 Pending payments
        <br>
        👥 Customers
        <br>
        🧾 Orders & invoices
        <br>
        💸 Expenses
        <br>
        💡 Business decisions

        <span class="time">
            ${new Date().toLocaleTimeString()}
        </span>
    `;

  messages.appendChild(welcome);

  // ---------------------------------------------------------
  // Send message
  // ---------------------------------------------------------

  async function sendAIMessage() {
    const text = input.value.trim();

    if (!text) return;

    // -----------------------------------------------------
    // User message
    // -----------------------------------------------------

    const userMsg = document.createElement("div");

    userMsg.className = "chat-msg user";

    userMsg.innerHTML = `
            ${escapeAIHtml(text)}

            <span class="time">
                ${new Date().toLocaleTimeString()}
            </span>
        `;

    messages.appendChild(userMsg);

    // Clear input
    input.value = "";

    // -----------------------------------------------------
    // Disable input while processing
    // -----------------------------------------------------

    input.disabled = true;
    sendBtn.disabled = true;

    // -----------------------------------------------------
    // Typing indicator
    // -----------------------------------------------------

    const typing = document.createElement("div");

    typing.className = "chat-msg bot";

    typing.innerHTML = `
            <span
                class="loader"
                style="
                    width:16px;
                    height:16px;
                    border-width:2px;
                    display:inline-block;
                    vertical-align:middle;
                    margin-right:8px;
                "
            ></span>

            Thinking...
        `;

    messages.appendChild(typing);

    messages.scrollTop = messages.scrollHeight;

    try {
      // -------------------------------------------------
      // Call Supabase Edge Function
      // -------------------------------------------------

      const client = getClient();

      const { data, error } = await client.functions.invoke("ai-assistant", {
        body: {
          message: text,

          history: aiConversationHistory.slice(-12),
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "AI assistant failed.");
      }

      const reply = data.reply || "No response received.";

      // -------------------------------------------------
      // Save conversation
      // -------------------------------------------------

      aiConversationHistory.push({
        role: "user",
        content: text,
      });

      aiConversationHistory.push({
        role: "assistant",
        content: reply,
      });

      // Keep last 12 messages
      if (aiConversationHistory.length > 12) {
        aiConversationHistory = aiConversationHistory.slice(-12);
      }

      // -------------------------------------------------
      // Remove typing
      // -------------------------------------------------

      typing.remove();

      // -------------------------------------------------
      // Bot response
      // -------------------------------------------------

      const botMsg = document.createElement("div");

      botMsg.className = "chat-msg bot";

      botMsg.innerHTML = `
                ${formatAIResponse(reply)}

                <span class="time">
                    ${new Date().toLocaleTimeString()}
                </span>
            `;

      messages.appendChild(botMsg);

      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      console.error("AI Assistant Error:", error);

      typing.remove();

      const botMsg = document.createElement("div");

      botMsg.className = "chat-msg bot";

      botMsg.innerHTML = `
                ❌ <strong>AI Assistant Error</strong>

                <br>

                ${escapeAIHtml(error?.message || "Something went wrong.")}

                <span class="time">
                    ${new Date().toLocaleTimeString()}
                </span>
            `;

      messages.appendChild(botMsg);

      messages.scrollTop = messages.scrollHeight;
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;

      input.focus();
    }
  }

  // ---------------------------------------------------------
  // Send button
  // ---------------------------------------------------------

  sendBtn.addEventListener("click", sendAIMessage);

  // ---------------------------------------------------------
  // Enter key
  // ---------------------------------------------------------

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendAIMessage();
    }
  });

  // ---------------------------------------------------------
  // Quick chips
  // ---------------------------------------------------------

  document.querySelectorAll(".quick-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.msg || chip.textContent.trim();

      sendAIMessage();
    });
  });
}

// =============================================================
// WHATSAPP SIMULATION
// =============================================================
function setupWhatsApp() {
  const input = document.getElementById("wa-input");
  const sendBtn = document.getElementById("wa-send");
  const body = document.getElementById("wa-body");
  if (!input || !sendBtn || !body) return;

  async function sendWaMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    const msg = document.createElement("div");
    msg.className = "msg customer";
    msg.innerHTML = `${text} <span class="time">${new Date().toLocaleTimeString()}</span>`;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;

    try {
      const parsed = parseIntent(text);
      let result;
      if (parsed.intent === "unknown") {
        result = {
          success: false,
          message: `🤔 I'm not sure how to help with that. Try: "I need 2 blue shirts" or "Spent ₹2500 on electricity"`,
        };
      } else {
        result = await executeIntent(parsed);
      }
      const reply = document.createElement("div");
      reply.className = "msg business";
      let replyText = result.message;
      if (result.success && parsed.intent === "create_order") {
        const orders = await getOrders();
        const lastOrder = orders[orders.length - 1];
        replyText = ` Order placed! ${parsed.quantity} × ${parsed.product_name || "product"}. Total: ₹${lastOrder?.total_amount || 0}`;
      }
      reply.innerHTML = `${replyText} <span class="time">${new Date().toLocaleTimeString()}</span>`;
      body.appendChild(reply);
      body.scrollTop = body.scrollHeight;

      if (result.success && parsed.intent === "create_order") {
        const orders = await getOrders();
        const lastOrder = orders[orders.length - 1];
        if (lastOrder) {
          const summary = document.createElement("div");
          summary.className = "order-summary";
          const items = (lastOrder.items || [])
            .map((i) => `${i.quantity}×${i.product_name} (₹${i.price})`)
            .join("<br>");
          summary.innerHTML = `
                                🧾 <strong>Order #${(lastOrder.id || "").slice(-4)}</strong><br>
                                ${items}<br>
                                <strong>Total: ₹${(lastOrder.total_amount || 0).toLocaleString()}</strong><br>
                                <span style="font-size:0.75rem;color:var(--gray-500);">Status: ${lastOrder.status || "New"} · Payment: ${lastOrder.payment_status || "Pending"}</span>
                                <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
                                  <a href="#" onclick="navigateTo('orders')" class="btn btn-primary btn-xs">View Order</a>
                                  <a href="#" onclick="navigateTo('invoices')" class="btn btn-outline btn-xs">View Invoice</a>
                                </div>
                              `;
          body.appendChild(summary);
          body.scrollTop = body.scrollHeight;
        }
      }
      updateDashboard();
    } catch (e) {
      const reply = document.createElement("div");
      reply.className = "msg business";
      reply.innerHTML = `❌ Error: ${e.message} <span class="time">${new Date().toLocaleTimeString()}</span>`;
      body.appendChild(reply);
      body.scrollTop = body.scrollHeight;
    }
  }

  sendBtn.addEventListener("click", sendWaMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendWaMessage();
  });
}

// =============================================================
// NAVIGATION
// =============================================================
function navigateTo(page) {
  document
    .querySelectorAll(".page-section")
    .forEach((el) => el.classList.remove("active"));
  if (page === "landing") {
    document.getElementById("landing-page").classList.add("active");
    currentPage = "landing";
    return;
  }
  if (page === "login") {
    document.getElementById("auth-page").classList.add("active");
    currentPage = "login";
    return;
  }
  if (currentUser) {
    document.getElementById("app-page").classList.add("active");
    const pageMap = {
      dashboard: "page-dashboard",
      orders: "page-orders",
      inventory: "page-inventory",
      customers: "page-customers",
      expenses: "page-expenses",
      payments: "page-payments",
      invoices: "page-invoices",
      "ai-assistant": "page-ai-assistant",
      insights: "page-insights",
      settings: "page-settings",
    };
    const targetId = pageMap[page] || "page-dashboard";
    document.getElementById(targetId).classList.add("active");
    document.querySelectorAll(".app-sidebar nav a").forEach((a) => {
      a.classList.toggle("active", a.dataset.page === page);
    });
    const titles = {
      dashboard: "Dashboard",
      orders: "Orders",
      inventory: "Inventory",
      customers: "Customers",
      expenses: "Expenses",
      payments: "Payments",
      invoices: "Invoices",
      "ai-assistant": "AI Assistant",
      insights: "Insights",
      settings: "Settings",
    };
    document.getElementById("page-title").textContent =
      titles[page] || "Dashboard";
    currentPage = page;
    refreshPage(page);
  } else {
    navigateTo("landing");
  }
  document.getElementById("app-sidebar")?.classList.remove("open");
}

async function refreshPage(page) {
  try {
    switch (page) {
      case "dashboard":
        await updateDashboard();
        break;
      case "orders":
        await renderOrders();
        break;
      case "inventory":
        await renderInventory();
        break;
      case "customers":
        await renderCustomers();
        break;
      case "expenses":
        await renderExpenses();
        break;
      case "payments":
        await renderPayments();
        break;
      case "invoices":
        await renderInvoices();
        break;
      case "insights":
        await renderInsights();
        break;
      case "settings":
        loadSettings();
        break;
    }
  } catch (e) {
    console.error("Refresh error:", e);
  }
}

// =============================================================
// ENTER APP
// =============================================================
function enterApp() {
  document
    .querySelectorAll(".page-section")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("app-page").classList.add("active");
  const nameEl = document.getElementById("sidebar-username");
  if (nameEl) {
    nameEl.textContent = currentUser?.email?.split("@")[0] || "User";
  }
  navigateTo("dashboard");
  document.getElementById("loadingOverlay").style.display = "none";
}

// =============================================================
// AUTH FORM TOGGLE
// =============================================================
function showAuthForm(type) {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  if (type === "login") {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  }
}

// =============================================================
// MODALS
// =============================================================
function openModal(title, contentHtml) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
                <div class="modal">
                  <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                  </div>
                  ${contentHtml}
                </div>
              `;
  document.body.appendChild(overlay);
  return overlay;
}

function openOrderModal() {
  openModal(
    "New Order",
    `
                <form id="modal-order-form">
                  <div class="form-group">
                    <label>Customer Name</label>
                    <input type="text" id="modal-order-customer" placeholder="Customer name" required />
                  </div>
                  <div class="form-group">
                    <label>Product</label>
                    <select id="modal-order-product" required></select>
                  </div>
                  <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" id="modal-order-qty" value="1" min="1" required />
                  </div>
                  <button type="submit" class="btn btn-primary w-full">Create Order</button>
                </form>
              `,
  );
  getProducts().then((products) => {
    const sel = document.getElementById("modal-order-product");
    if (sel) {
      sel.innerHTML = products
        .map(
          (p) =>
            `<option value="${p.id}">${p.name} (₹${p.price || 0} · ${p.stock || 0} in stock)</option>`,
        )
        .join("");
    }
  });
  document
    .getElementById("modal-order-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const customer = document
        .getElementById("modal-order-customer")
        .value.trim();
      const productId = document.getElementById("modal-order-product").value;
      const qty =
        parseInt(document.getElementById("modal-order-qty").value) || 1;
      const products = await getProducts();
      const product = products.find((p) => p.id === productId);
      if (!product) {
        showToast("Product not found", "error");
        return;
      }
      let customers = await getCustomers();
      let cust = customers.find(
        (c) => c.name.toLowerCase() === customer.toLowerCase(),
      );
      if (!cust) {
        cust = await addCustomer({
          name: customer,
          phone: "",
          email: "",
        });
      }
      const total = (product.price || 0) * qty;
      const order = {
        customer_id: cust.id,
        customer_name: cust.name,
        total_amount: total,
        status: "New",
        payment_status: "Pending",
        items: [
          {
            product_name: product.name,
            quantity: qty,
            price: product.price || 0,
          },
        ],
      };
      const createdOrder = await addOrder(order);
      await updateProduct(product.id, {
        stock: Math.max(0, (product.stock || 0) - qty),
      });
      const invoices = await getInvoices();
      await addInvoice({
        order_id: createdOrder.id,
        invoice_number: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
        subtotal: total,
        tax: 0,
        total: total,
        status: "Pending",
      });
      await addPayment({
        customer_name: cust.name,
        amount: total,
        status: "Pending",
        order_id: createdOrder.id,
      });
      await updateCustomer(cust.id, {
        total_orders: (cust.total_orders || 0) + 1,
        total_spending: (cust.total_spending || 0) + total,
        pending_payment: (cust.pending_payment || 0) + total,
        last_order_date: new Date().toISOString().slice(0, 10),
      });
      showToast(
        ` Order created! ${qty}×${product.name} = ₹${total.toLocaleString()}`,
        "success",
      );
      document.querySelector(".modal-overlay")?.remove();
      renderOrders();
      updateDashboard();
    });
}

function openProductModal() {
  openModal(
    "Add Product",
    `
                <form id="modal-product-form">
                  <div class="form-group">
                    <label>Product Name *</label>
                    <input type="text" id="modal-product-name" required />
                  </div>
                  <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="modal-product-category" placeholder="e.g. Shirts" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Price (₹) *</label>
                      <input type="number" id="modal-product-price" min="0" step="1" required />
                    </div>
                    <div class="form-group">
                      <label>Cost Price (₹)</label>
                      <input type="number" id="modal-product-cost" min="0" step="1" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Stock *</label>
                      <input type="number" id="modal-product-stock" min="0" value="0" required />
                    </div>
                    <div class="form-group">
                      <label>Min Stock</label>
                      <input type="number" id="modal-product-min" min="0" value="5" />
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary w-full">Add Product</button>
                </form>
              `,
  );
  document
    .getElementById("modal-product-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const product = {
        name: document.getElementById("modal-product-name").value.trim(),
        category:
          document.getElementById("modal-product-category").value.trim() ||
          "Other",
        price:
          parseFloat(document.getElementById("modal-product-price").value) || 0,
        cost_price:
          parseFloat(document.getElementById("modal-product-cost").value) || 0,
        stock:
          parseInt(document.getElementById("modal-product-stock").value) || 0,
        minimum_stock:
          parseInt(document.getElementById("modal-product-min").value) || 5,
      };
      if (!product.name || product.price <= 0) {
        showToast("Please fill in all required fields", "error");
        return;
      }
      await addProduct(product);
      showToast(` ${product.name} added to inventory!`, "success");
      document.querySelector(".modal-overlay")?.remove();
      renderInventory();
      updateDashboard();
    });
}

function openCustomerModal() {
  openModal(
    "Add Customer",
    `
                <form id="modal-customer-form">
                  <div class="form-group">
                    <label>Customer Name *</label>
                    <input type="text" id="modal-customer-name" required />
                  </div>
                  <div class="form-group">
                    <label>Phone</label>
                    <input type="text" id="modal-customer-phone" placeholder="+91 98765 43210" />
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="modal-customer-email" placeholder="customer@example.com" />
                  </div>
                  <button type="submit" class="btn btn-primary w-full">Add Customer</button>
                </form>
              `,
  );
  document
    .getElementById("modal-customer-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const customer = {
        name: document.getElementById("modal-customer-name").value.trim(),
        phone:
          document.getElementById("modal-customer-phone").value.trim() || "",
        email:
          document.getElementById("modal-customer-email").value.trim() || "",
      };
      if (!customer.name) {
        showToast("Please enter a customer name", "error");
        return;
      }
      await addCustomer(customer);
      showToast(` ${customer.name} added!`, "success");
      document.querySelector(".modal-overlay")?.remove();
      renderCustomers();
      updateDashboard();
    });
}

function openExpenseModal() {
  openModal(
    "Add Expense",
    `
                <form id="modal-expense-form">
                  <div class="form-group">
                    <label>Category *</label>
                    <select id="modal-expense-category" required>
                      <option value="Inventory">Inventory</option>
                      <option value="Rent">Rent</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Salary">Salary</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" id="modal-expense-amount" min="0" step="1" required />
                  </div>
                  <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="modal-expense-desc" placeholder="What was this for?" />
                  </div>
                  <button type="submit" class="btn btn-primary w-full">Add Expense</button>
                </form>
              `,
  );
  document
    .getElementById("modal-expense-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const expense = {
        category: document.getElementById("modal-expense-category").value,
        amount:
          parseFloat(document.getElementById("modal-expense-amount").value) ||
          0,
        description:
          document.getElementById("modal-expense-desc").value.trim() || "",
        expense_date: new Date().toISOString().slice(0, 10),
      };
      if (expense.amount <= 0) {
        showToast("Please enter a valid amount", "error");
        return;
      }
      await addExpense(expense);
      showToast(
        ` ${expense.category} expense of ₹${expense.amount} recorded!`,
        "success",
      );
      document.querySelector(".modal-overlay")?.remove();
      renderExpenses();
      updateDashboard();
    });
}

// =============================================================
// ORDER & PAYMENT ACTIONS
// =============================================================
async function viewOrder(id) {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) {
    showToast("Order not found", "error");
    return;
  }
  const items = (order.items || [])
    .map(
      (i) =>
        `${i.product_name} ×${i.quantity} = ₹${((i.quantity || 0) * (i.price || 0)).toLocaleString()}`,
    )
    .join("<br>");
  openModal(
    `Order #${(id || "").slice(-4)}`,
    `
                <div style="font-size:0.95rem;">
                  <p><strong>Customer:</strong> ${order.customer_name || "—"}</p>
                  <p><strong>Total:</strong> ₹${(order.total_amount || 0).toLocaleString()}</p>
                  <p><strong>Status:</strong> ${order.status || "New"} · <strong>Payment:</strong> ${order.payment_status || "Pending"}</p>
                  <p><strong>Date:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</p>
                  <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);">
                    <strong>Items:</strong>
                    <div style="margin-top:6px;font-size:0.9rem;">${items || "No items"}</div>
                  </div>
                  <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${id}','Confirmed')">Confirm</button>
                    <button class="btn btn-success btn-sm" onclick="updateOrderStatus('${id}','Delivered')">Deliver</button>
                    <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${id}','Cancelled')">Cancel</button>
                    <button class="btn btn-outline btn-sm" onclick="this.closest('.modal-overlay').remove()">Close</button>
                  </div>
                </div>
              `,
  );
}

async function updateOrderStatus(id, status) {
  await updateOrder(id, { status });
  showToast(` Order status updated to ${status}`, "success");
  renderOrders();
  updateDashboard();
  document.querySelector(".modal-overlay")?.remove();
}

async function markPaymentPaid(id) {
  await updatePayment(id, { status: "Paid" });
  const payments = await getPayments();
  const payment = payments.find((p) => p.id === id);
  if (payment && payment.order_id) {
    await updateOrder(payment.order_id, { payment_status: "Paid" });
    const invoices = await getInvoices();
    const inv = invoices.find((i) => i.order_id === payment.order_id);
    if (inv) await updateInvoice(inv.id, { status: "Paid" });
    const customers = await getCustomers();
    const cust = customers.find((c) => c.name === payment.customer_name);
    if (cust) {
      await updateCustomer(cust.id, {
        pending_payment: Math.max(
          0,
          (cust.pending_payment || 0) - (payment.amount || 0),
        ),
      });
    }
  }
  showToast(" Payment marked as paid!", "success");
  renderPayments();
  updateDashboard();
}

// =============================================================
// SETTINGS
// =============================================================
function loadSettings() {
  document.getElementById("settings-supabase-url").value = SUPABASE_URL;
  document.getElementById("settings-supabase-key").value = SUPABASE_ANON_KEY;
  document.getElementById("settings-business-name").value =
    currentBusiness?.name || "";
  document.getElementById("settings-business-type").value =
    currentBusiness?.type || "";
}

async function updateBusinessInfo() {
  const Update_btn = document.getElementById('update_info_btn');
  Update_btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`
  const name = document.getElementById("settings-business-name").value.trim();
  const contact = document
    .getElementById("settings-contact-number")
    .value.trim();
  const type = document.getElementById("settings-business-type").value.trim();
  if (!name) {
    showToast("Please enter a business name", "warning");
    return;
  }
  try {
    const client = getClient();
    const { error } = await client
      .from("businesses")
      .update({
        name,
        type: type || "Retail",
        wa_phone_number_id: contact,
      })
      .eq("id", currentBusiness.id);
    if (error) throw error;
    currentBusiness.name = name;
    currentBusiness.type = type || "Retail";
    showToast(" Business info updated!", "success");
  } catch (e) {
    showToast("❌ " + e.message, "error");
  }
  Update_btn.innerHTML = `Update Business`
}

async function clearAllData() {
  try {
    const client = getClient();
    const tables = [
      "products",
      "customers",
      "orders",
      "expenses",
      "payments",
      "invoices",
    ];
    for (const table of tables) {
      await client.from(table).delete().eq("business_id", currentBusiness.id);
    }
    showToast(" All data cleared!", "success");
    refreshPage(currentPage);
    updateDashboard();
  } catch (e) {
    showToast("❌ " + e.message, "error");
  }
}

// =============================================================
// SIDEBAR TOGGLE
// =============================================================
// =============================================================
// SIDEBAR TOGGLE
// =============================================================
function initSidebar() {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("app-sidebar");

  if (!hamburger || !sidebar) return;

  // Prevent duplicate event listeners
  if (hamburger.dataset.sidebarInitialized === "true") return;
  hamburger.dataset.sidebarInitialized = "true";

  hamburger.setAttribute("aria-expanded", "false");

  hamburger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = sidebar.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  // Close sidebar when clicking outside
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 992) return;

    const clickedInsideSidebar = sidebar.contains(e.target);
    const clickedHamburger = hamburger.contains(e.target);

    if (!clickedInsideSidebar && !clickedHamburger) {
      sidebar.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });

  // Close sidebar when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && window.innerWidth <= 992) {
      sidebar.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });
}
// =============================================================
// INIT
// =============================================================
document.addEventListener("DOMContentLoaded", function () {
  // Override with stored values if any
  const storedUrl = localStorage.getItem("sb_url_override");
  const storedKey = localStorage.getItem("sb_key_override");
  if (storedUrl && storedKey) {
    // We can't reassign const, but we can use them for init
    // Actually we'll just use the constants as they are; user can update via settings
    // So we ignore stored override for simplicity, but we could.
  }

  // Init Supabase with hardcoded keys
  const client = initSupabase();

  // Check session
  if (client) {
    client.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session) {
          currentUser = data.session.user;
          await loadBusiness();
          enterApp();
        } else {
          document.getElementById("loadingOverlay").style.display = "none";
          navigateTo("landing");
        }
      })
      .catch(() => {
        document.getElementById("loadingOverlay").style.display = "none";
        navigateTo("landing");
      });
  } else {
    document.getElementById("loadingOverlay").style.display = "none";
    navigateTo("landing");
    // Show a toast about missing keys
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      showToast(
        "Please set SUPABASE_URL and SUPABASE_ANON_KEY in the script.",
        "warning",
      );
    }
  }

  // Auth forms
  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    signIn(email, password);
  });
  document.getElementById("signup-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const business = document.getElementById("signup-business").value;
    signUp(email, password, business);
  });

  initSidebar();
  setupAIChat();
  setupWhatsApp();

  // Auto-refresh dashboard
  setInterval(() => {
    if (currentPage === "dashboard") updateDashboard();
  }, 30000);
});

// =============================================================
// EXPOSE GLOBALS
// =============================================================
window.navigateTo = navigateTo;
window.showAuthForm = showAuthForm;
window.handleLogout = handleLogout;
window.openOrderModal = openOrderModal;
window.openProductModal = openProductModal;
window.openCustomerModal = openCustomerModal;
window.openExpenseModal = openExpenseModal;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.markPaymentPaid = markPaymentPaid;
window.viewInvoice = viewInvoice;
window.printInvoice = printInvoice;
window.updateBusinessInfo = updateBusinessInfo;
window.clearAllData = clearAllData;

console.log("Credentials:", SUPABASE_URL ? "Set" : "Missing");
