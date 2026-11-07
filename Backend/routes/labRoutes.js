
// const express = require("express");
// const router = express.Router();

// const {
//   createTest,
//   getTests,
//   updateTest,
//   deleteTest,
//   createOrder,
//   getOrders,
//   getOrder,
//   getPatientLabHistory,
//   collectSample,
//   enterResults,
//   verifyOrder,
//   cancelOrder,
// } = require("../controllers/labController");

// const { protect, authorize } = require("../middleware/authMiddleware");

// // All laboratory routes require login
// router.use(protect);

// // Lab test catalog
// router.route("/tests")
//   .get(getTests)
//   .post(authorize("admin"), createTest);

// router.route("/tests/:id")
//   .put(authorize("admin"), updateTest)
//   .delete(authorize("admin"), deleteTest);

// // Lab orders
// router.route("/orders")
//   .get(getOrders)
//   .post(createOrder);

// router.get("/orders/patient/:patientId", getPatientLabHistory);
// router.get("/orders/:id", getOrder);

// // Sample collection and result entry
// router.patch("/orders/:id/collect", collectSample);
// router.put("/orders/:id/results", enterResults);
// router.patch("/orders/:id/verify", verifyOrder);
// router.patch("/orders/:id/cancel", cancelOrder);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  createTest,
  getTests,
  updateTest,
  deleteTest,
  createOrder,
  getOrders,
  getOrder,
  getPatientLabHistory,
  collectSample,
  enterResults,
  verifyOrder,
  cancelOrder,
} = require("../controllers/labController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Lab test catalog
router.route("/tests")
  .get(getTests)
  .post(authorize("admin"), createTest);

router.route("/tests/:id")
  .put(authorize("admin"), updateTest)
  .delete(authorize("admin"), deleteTest);

// Lab orders
router.route("/orders")
  .get(authorize("admin", "doctor", "labtechnician", "receptionist"), getOrders)
  .post(authorize("admin", "doctor"), createOrder);

router.get(
  "/orders/patient/:patientId",
  authorize("admin", "doctor", "labtechnician"),
  getPatientLabHistory
);

router.get(
  "/orders/:id",
  authorize("admin", "doctor", "labtechnician"),
  getOrder
);

// Sample collection
router.patch(
  "/orders/:id/collect",
  authorize("admin", "labtechnician"),
  collectSample
);

// Results entry
router.put(
  "/orders/:id/results",
  authorize("admin", "labtechnician"),
  enterResults
);

// Report verification
router.patch(
  "/orders/:id/verify",
  authorize("admin", "pathologist"),
  verifyOrder
);

// Cancel order
router.patch(
  "/orders/:id/cancel",
  authorize("admin", "doctor"),
  cancelOrder
);

module.exports = router;
