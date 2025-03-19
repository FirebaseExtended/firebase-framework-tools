const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'firebase-ecommerce',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

exports.upsertCustomerRef = function upsertCustomerRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertCustomer', inputVars);
}
exports.upsertCustomer = function upsertCustomer(dcOrVars, vars) {
  return executeMutation(upsertCustomerRef(dcOrVars, vars));
};
exports.createProductReviewRef = function createProductReviewRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateProductReview', inputVars);
}
exports.createProductReview = function createProductReview(dcOrVars, vars) {
  return executeMutation(createProductReviewRef(dcOrVars, vars));
};
exports.createOrderRef = function createOrderRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateOrder', inputVars);
}
exports.createOrder = function createOrder(dcOrVars, vars) {
  return executeMutation(createOrderRef(dcOrVars, vars));
};
exports.updateOrderByPaymentIntentIdRef = function updateOrderByPaymentIntentIdRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateOrderByPaymentIntentId', inputVars);
}
exports.updateOrderByPaymentIntentId = function updateOrderByPaymentIntentId(dcOrVars, vars) {
  return executeMutation(updateOrderByPaymentIntentIdRef(dcOrVars, vars));
};
exports.updateOrderByChargeIdRef = function updateOrderByChargeIdRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateOrderByChargeId', inputVars);
}
exports.updateOrderByChargeId = function updateOrderByChargeId(dcOrVars, vars) {
  return executeMutation(updateOrderByChargeIdRef(dcOrVars, vars));
};
exports.createOrderItemRef = function createOrderItemRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateOrderItem', inputVars);
}
exports.createOrderItem = function createOrderItem(dcOrVars, vars) {
  return executeMutation(createOrderItemRef(dcOrVars, vars));
};
exports.listCustomersRef = function listCustomersRef(dc) {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCustomers');
}
exports.listCustomers = function listCustomers(dc) {
  return executeQuery(listCustomersRef(dc));
};
exports.getReviewsByHandleRef = function getReviewsByHandleRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetReviewsByHandle', inputVars);
}
exports.getReviewsByHandle = function getReviewsByHandle(dcOrVars, vars) {
  return executeQuery(getReviewsByHandleRef(dcOrVars, vars));
};
exports.getProductByHandleRef = function getProductByHandleRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProductByHandle', inputVars);
}
exports.getProductByHandle = function getProductByHandle(dcOrVars, vars) {
  return executeQuery(getProductByHandleRef(dcOrVars, vars));
};
exports.getCollectionByHandleRef = function getCollectionByHandleRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCollectionByHandle', inputVars);
}
exports.getCollectionByHandle = function getCollectionByHandle(dcOrVars, vars) {
  return executeQuery(getCollectionByHandleRef(dcOrVars, vars));
};
exports.getCollectionsByPageRef = function getCollectionsByPageRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCollectionsByPage', inputVars);
}
exports.getCollectionsByPage = function getCollectionsByPage(dcOrVars, vars) {
  return executeQuery(getCollectionsByPageRef(dcOrVars, vars));
};
exports.searchProductDescriptionUsingL2similarityRef = function searchProductDescriptionUsingL2similarityRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchProductDescriptionUsingL2Similarity', inputVars);
}
exports.searchProductDescriptionUsingL2similarity = function searchProductDescriptionUsingL2similarity(dcOrVars, vars) {
  return executeQuery(searchProductDescriptionUsingL2similarityRef(dcOrVars, vars));
};
exports.searchProductTitleUsingL2similarityRef = function searchProductTitleUsingL2similarityRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchProductTitleUsingL2Similarity', inputVars);
}
exports.searchProductTitleUsingL2similarity = function searchProductTitleUsingL2similarity(dcOrVars, vars) {
  return executeQuery(searchProductTitleUsingL2similarityRef(dcOrVars, vars));
};
exports.searchProductReviewContentUsingL2similarityRef = function searchProductReviewContentUsingL2similarityRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchProductReviewContentUsingL2Similarity', inputVars);
}
exports.searchProductReviewContentUsingL2similarity = function searchProductReviewContentUsingL2similarity(dcOrVars, vars) {
  return executeQuery(searchProductReviewContentUsingL2similarityRef(dcOrVars, vars));
};
exports.getOrdersByCustomerIdRef = function getOrdersByCustomerIdRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetOrdersByCustomerId', inputVars);
}
exports.getOrdersByCustomerId = function getOrdersByCustomerId(dcOrVars, vars) {
  return executeQuery(getOrdersByCustomerIdRef(dcOrVars, vars));
};
exports.getCurrentCustomerOrdersRef = function getCurrentCustomerOrdersRef(dc) {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCurrentCustomerOrders');
}
exports.getCurrentCustomerOrders = function getCurrentCustomerOrders(dc) {
  return executeQuery(getCurrentCustomerOrdersRef(dc));
};
exports.getOrderByIdRef = function getOrderByIdRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetOrderById', inputVars);
}
exports.getOrderById = function getOrderById(dcOrVars, vars) {
  return executeQuery(getOrderByIdRef(dcOrVars, vars));
};
