const Bill = require("../models/Bill");
const generateId = require("./generateId");

const recalc = (bill) => {
  bill.totalAmount = bill.items.reduce((s, i) => s + i.quantity * i.amount, 0);
  bill.paidAmount = bill.payments.reduce((s, p) => s + p.amount, 0);
  bill.status =
    bill.paidAmount <= 0 ? "unpaid" : bill.paidAmount >= bill.totalAmount ? "paid" : "partial";
  return bill;
};

// Adds a line to the admission's bill (creates it if needed).
const addToBill = async ({ patient, admission = null, description, amount, quantity = 1, createdBy }) => {
  let bill = admission ? await Bill.findOne({ admission }) : null;
  if (!bill) {
    bill = new Bill({
      billNo: await generateId(Bill, "BILL"),
      patient,
      admission,
      items: [],
      payments: [],
      createdBy,
    });
  }
  bill.items.push({ description, amount, quantity });
  recalc(bill);
  await bill.save();
  return bill;
};

module.exports = { recalc, addToBill };