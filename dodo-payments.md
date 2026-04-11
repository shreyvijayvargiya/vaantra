const payment = await client.payments.create({
  billing: { country: 'IN' },
  customer: { email: 'user@example.com' },
  billing_currency: 'INR', // or 'USD'
  product_cart: [
    {
      product_id: 'prod_pay_what_you_want',
      quantity: 1,
      amount: 49900, // ₹499.00 if INR, $499.00 if USD
    }
  ],
  payment_link: true,
  return_url: 'https://yourapp.com/success'
});