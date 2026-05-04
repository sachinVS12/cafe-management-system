const generateOrderReport = async (startDate, endDate) => {
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
  }).populate("user items.product");

  return {
    labels: getDateLabels(startDate, endDate),
    data: processOrderData(orders),
  };
};

const getDateLabels = (startDate, endDate) => {
  const labels = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    labels.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return labels;
};

const processOrderData = (orders) => {
  const dailyData = {};

  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split("T")[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        orders: 0,
        revenue: 0,
        items: 0,
      };
    }
    dailyData[date].orders++;
    dailyData[date].revenue += order.totalAmount;
    dailyData[date].items += order.items.length;
  });

  return dailyData;
};

const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

module.exports = {
  generateOrderReport,
  getDateLabels,
  processOrderData,
  calculateGrowthRate,
};
