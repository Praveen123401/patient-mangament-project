const asyncHandler = require("express-async-handler");
const Medicine = require("../models/Medicine");
const { addToBill } = require("../utils/billHelper");
const { getPagination, searchRegex, sendPaginated } = require("../utils/apiFeatures");

exports.addMedicine = asyncHandler(async (req, res) => {
  const med = await Medicine.create(req.body);
  res.status(201).json({ success: true, data: med });
});

// GET /api/pharmacy?search=&category=
exports.getMedicines = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$or = [{ name: searchRegex(req.query.search) }, { genericName: searchRegex(req.query.search) }];
  const [data, total] = await Promise.all([
    Medicine.find(filter).sort("name").skip(pg.skip).limit(pg.limit),
    Medicine.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

exports.getMedicine = asyncHandler(async (req, res) => {
  const med = await Medicine.findById(req.params.id);
  if (!med) {
    res.status(404);
    throw new Error("Medicine not found");
  }
  res.json({ success: true, data: med });
});

exports.updateMedicine = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  delete body.stock; // stock changes only via restock / dispense
  const med = await Medicine.findByIdAndUpdate(req.params.id, body, { returnDocument: "after", runValidators: true });
  if (!med) {
    res.status(404);
    throw new Error("Medicine not found");
  }
  res.json({ success: true, data: med });
});

// PATCH /api/pharmacy/:id/restock   body: { quantity, expiryDate?, batchNo? }
exports.restock = asyncHandler(async (req, res) => {
  const qty = Number(req.body.quantity);
  if (!(qty > 0)) {
    res.status(400);
    throw new Error("Quantity must be greater than 0");
  }
  const update = { $inc: { stock: qty } };
  if (req.body.expiryDate || req.body.batchNo) {
    update.$set = {};
    if (req.body.expiryDate) update.$set.expiryDate = req.body.expiryDate;
    if (req.body.batchNo) update.$set.batchNo = req.body.batchNo;
  }
  const med = await Medicine.findByIdAndUpdate(req.params.id, update, { returnDocument: "after" });
  if (!med) {
    res.status(404);
    throw new Error("Medicine not found");
  }
  res.json({ success: true, data: med });
});

// POST /api/pharmacy/dispense   body: { patient, admission?, items: [{ medicine, quantity }] }
exports.dispense = asyncHandler(async (req, res) => {
  const { patient, admission, items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    res.status(400);
    throw new Error("items are required");
  }

  const done = []; // for rollback if one item fails
  try {
    for (const it of items) {
      const qty = Number(it.quantity);
      const med = await Medicine.findOneAndUpdate(
        { _id: it.medicine, isActive: true, stock: { $gte: qty }, expiryDate: { $not: { $lt: new Date() } } },
        { $inc: { stock: -qty } },
        { returnDocument: "after" }
      );
      if (!med) {
        res.status(400);
        throw new Error("A medicine is out of stock, expired or invalid");
      }
      done.push({ id: med._id, qty });
      await addToBill({
        patient,
        admission,
        description: `Pharmacy - ${med.name}`,
        amount: med.price,
        quantity: qty,
        createdBy: req.user._id,
      });
    }
  } catch (err) {
    await Promise.all(done.map((d) => Medicine.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })));
    throw err;
  }
  res.json({ success: true, message: "Medicines dispensed" });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const data = await Medicine.find({ isActive: true, $expr: { $lte: ["$stock", "$reorderLevel"] } }).sort("stock");
  res.json({ success: true, count: data.length, data });
});

// GET /api/pharmacy/expiring?days=30
exports.getExpiring = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const limit = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const data = await Medicine.find({ isActive: true, expiryDate: { $lte: limit } }).sort("expiryDate");
  res.json({ success: true, count: data.length, data });
});