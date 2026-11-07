// Compare a lab value with the test's normal range
const flagResult = (value, test = {}) => {
  const v = Number(value);
  const { min, max } = test.normalRange || {};
  if (Number.isNaN(v) || (min == null && max == null)) return "n/a";
  if (test.criticalLow != null && v <= test.criticalLow) return "critical";
  if (test.criticalHigh != null && v >= test.criticalHigh) return "critical";
  if (min != null && v < min) return "low";
  if (max != null && v > max) return "high";
  return "normal";
};

module.exports = flagResult;