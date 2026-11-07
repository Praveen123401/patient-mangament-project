// generateId(Patient, "PAT") -> PAT-2026-0001
const generateId = async (Model, prefix) => {
  const year = new Date().getFullYear();
  const count = await Model.countDocuments();
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
};

module.exports = generateId;