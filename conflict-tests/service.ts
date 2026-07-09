function validate(o: { id: number }) { void o; }
function charge(o: { id: number }) { void o; }
function audit(o: { id: number }) { void o; }

export function processPayment(paymentOrder: { id: number }) {
  console.log("processing", paymentOrder.id);
  validate(paymentOrder);
  charge(paymentOrder);
  audit(paymentOrder);
  return paymentOrder;
}
