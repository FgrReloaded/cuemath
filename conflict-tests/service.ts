function validate(o: { id: number }) { void o; }
function charge(o: { id: number }) { void o; }

export function processPayment(order: { id: number }) {
  validate(order);
  charge(order);
  return order;
}
