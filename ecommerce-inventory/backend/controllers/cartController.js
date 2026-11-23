const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok } = require("../utils/apiResponse");

const getCart = (userId) => Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { items: [] } }, { upsert: true, new: true });

// Builds the response. ALL prices come from the Product collection, calculated here on the server.
const format = async (cart) => {
  await cart.populate("items.product", "name price stock images isActive");
  const items = cart.items
    .filter((i) => i.product && i.product.isActive)
    .map((i) => ({
      productId: i.product.id, name: i.product.name, image: i.product.images[0] || null,
      price: i.product.price, stock: i.product.stock, quantity: i.quantity,
      lineTotal: Math.round(i.product.price * i.quantity * 100) / 100,
      available: i.product.stock >= i.quantity,
    }));
  const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
  return { items, itemCount: items.reduce((s, i) => s + i.quantity, 0), subtotal, total: subtotal };
};

exports.get = asyncHandler(async (req, res) => ok(res, await format(await getCart(req.user.id))));

exports.add = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const quantity = Number(req.body.quantity);
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(404, "Product not found");
  const cart = await getCart(req.user.id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  const newQty = (existing ? existing.quantity : 0) + quantity;
  if (newQty > product.stock) throw new ApiError(409, `Only ${product.stock} unit(s) available in stock`);
  if (existing) existing.quantity = newQty; else cart.items.push({ product: productId, quantity });
  await cart.save();
  ok(res, await format(cart), "Added to cart", 201);
});

exports.update = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  const cart = await getCart(req.user.id);
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) throw new ApiError(404, "Item not in cart");
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) throw new ApiError(404, "Product not found");
  if (quantity > product.stock) throw new ApiError(409, `Only ${product.stock} unit(s) available in stock`);
  item.quantity = quantity;
  await cart.save();
  ok(res, await format(cart), "Cart updated");
});

exports.remove = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  ok(res, await format(cart), "Item removed");
});
