class PaymentService {
  constructor(apiKey) { this.apiKey = apiKey; }
  authorize(card) {
    if (typeof card !== 'string' || !/^\d{13,19}$/.test(card)) return { status: 'DENIED' };
    return { status: card.startsWith('4') ? 'PAID' : 'DENIED', last4: card.slice(-4) };
  }
}

module.exports = { PaymentService };
