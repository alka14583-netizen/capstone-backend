// Fills the database with demo data. Run with: npm run seed
// WARNING: this DELETES existing data in the collections below.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const RefreshToken = require("../models/RefreshToken");
const inventory = require("../services/inventoryService");

const img = (seed) => `https://picsum.photos/seed/${seed}/600/420`;
const daysAgo = (d) => new Date(Date.now() - d * 24 * 3600 * 1000);

(async () => {
  await connectDB();
  await Promise.all([User, Category, Product, Cart, Order, Inventory, Notification, RefreshToken].map((m) => m.deleteMany({})));

  // Users (passwords are demo-only and are hashed by the User model)
  const admin = await User.create({ name: "Admin User", email: "admin@shop.com", password: "Admin@123", role: "admin" });
  const [s1, s2] = await Promise.all([
    User.create({ name: "TechWorld Seller", email: "seller1@shop.com", password: "Seller@123", role: "seller" }),
    User.create({ name: "HomeStyle Seller", email: "seller2@shop.com", password: "Seller@123", role: "seller" }),
  ]);
  const customers = [];
  for (const [n, e] of [["Aarav Sharma", "customer1@shop.com"], ["Priya Singh", "customer2@shop.com"], ["Rohan Verma", "customer3@shop.com"]]) {
    customers.push(await User.create({ name: n, email: e, password: "Customer@123", role: "customer" }));
  }

  // Categories
  const cats = {};
  for (const [name, description] of [
    ["Electronics", "Phones, laptops and gadgets"], ["Fashion", "Clothing and accessories"],
    ["Home & Kitchen", "Everything for your home"], ["Books", "Study and leisure reading"], ["Sports", "Fitness and outdoor gear"],
  ]) cats[name] = await Category.create({ name, description });

  // 15 products (stock set to 0 first; the inventory service then records the initial stock)
  const defs = [
    ["Wireless Headphones", "Electronics", s1, 2499, 40, "Over-ear Bluetooth headphones with 30 hour battery."],
    ["Smartphone 128GB", "Electronics", s1, 15999, 25, "6.5 inch display, dual camera, fast charging."],
    ["Laptop 15 inch", "Electronics", s1, 45999, 12, "Intel i5, 8GB RAM, 512GB SSD."],
    ["Smart Watch", "Electronics", s1, 3499, 3, "Fitness tracking, heart-rate monitor, water resistant."],
    ["Cotton T-Shirt", "Fashion", s2, 599, 100, "Soft 100% cotton, regular fit."],
    ["Denim Jacket", "Fashion", s2, 1899, 30, "Classic blue denim jacket."],
    ["Running Shoes", "Sports", s2, 2299, 45, "Lightweight shoes with cushioned sole."],
    ["Yoga Mat", "Sports", s2, 799, 60, "Non-slip 6mm yoga mat."],
    ["Football", "Sports", s2, 699, 4, "Size 5 match football."],
    ["Non-stick Pan Set", "Home & Kitchen", s2, 1599, 35, "3-piece non-stick cookware set."],
    ["Electric Kettle", "Home & Kitchen", s2, 999, 50, "1.5 litre stainless steel kettle."],
    ["Table Lamp", "Home & Kitchen", s2, 849, 28, "LED desk lamp with adjustable brightness."],
    ["Node.js Handbook", "Books", s1, 499, 70, "Learn backend development step by step."],
    ["Database Systems", "Books", s1, 650, 55, "A clear introduction to databases and MongoDB."],
    ["Bluetooth Speaker", "Electronics", s1, 1799, 20, "Portable waterproof speaker with deep bass."],
  ];
  const products = [];
  for (const [name, cat, seller, price, stock, description] of defs) {
    const p = await Product.create({
      name, description, price, stock, category: cats[cat]._id, seller: seller._id,
      images: [img(name.replace(/\W+/g, "-").toLowerCase())],
    });
    await Inventory.create({ product: p._id, seller: seller._id, type: "restock", quantityChange: stock, stockBefore: 0, stockAfter: stock, performedBy: seller._id, note: "Initial stock" });
    products.push(p);
  }

  // Sample orders spread over several months (so the monthly revenue chart has data)
  const addr = { fullName: "Demo Customer", phone: "9876543210", line1: "12 MG Road", city: "Gurugram", state: "Haryana", postalCode: "122001" };
  const plan = [
    [0, 100, "Delivered", [[0, 1], [4, 2]]], [1, 75, "Delivered", [[1, 1]]], [2, 50, "Delivered", [[6, 1], [7, 2], [12, 1]]],
    [0, 30, "Shipped", [[2, 1]]], [1, 12, "Processing", [[9, 1], [10, 2]]], [2, 3, "Pending", [[13, 2], [14, 1]]], [0, 1, "Pending", [[5, 1]]],
  ];
  let n = 1;
  for (const [ci, age, status, lines] of plan) {
    const items = [];
    const orderId = new mongoose.Types.ObjectId();
    for (const [pi, qty] of lines) {
      const p = await Product.findById(products[pi]._id);
      await inventory.reduceStock(p._id, qty, { orderId, userId: customers[ci].id });
      items.push({ product: p._id, seller: p.seller, name: p.name, price: p.price, quantity: qty, lineTotal: p.price * qty });
    }
    await Order.create({
      _id: orderId, orderNumber: `ORD-DEMO-${1000 + n++}`, customer: customers[ci]._id, items,
      totalAmount: items.reduce((s, i) => s + i.lineTotal, 0), shippingAddress: { ...addr, fullName: customers[ci].name },
      status, statusHistory: [{ status, changedBy: admin._id, at: daysAgo(age) }], createdAt: daysAgo(age), updatedAt: daysAgo(age),
    });
  }

  console.log("Seed complete.\n  admin@shop.com / Admin@123\n  seller1@shop.com, seller2@shop.com / Seller@123\n  customer1..3@shop.com / Customer@123");
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
