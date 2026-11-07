// Number of billable days (minimum 1)
const calculateStay = (from, to = new Date()) =>
  Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)));

module.exports = calculateStay;