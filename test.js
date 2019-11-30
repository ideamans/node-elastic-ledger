const test = require('ava')
const ElasticLedger = require('./index')

test('Journal and convolution', t => {
  const el = new ElasticLedger({ limit: 5 })
  el.append({ value: 1 })
  const first = el.convolute()
  t.is(first.value, 1)

  for ( let i = 2; i <= 6; i++) {
    el.append({ value: i })
  }
  t.is(el.records.length, 5)
  const second = el.convolute()
  t.is(second.value, 21)
})

test('Limit is 1', t => {
  const el = new ElasticLedger({ limit: 1 })
  for ( let i = 1; i <= 5; i++) {
    el.append({ value: i })
  }
  t.is(el.records.length, 1)
  t.is(el.convolute().value, 15)
})

test('Append carray over records', t => {
  const el = new ElasticLedger({ limit: 5 })

  el.append({ value: 1 })
  el.append({ value: 1, carryOver: true })

  t.is(el.convolute().value, 1)
})

test('Checkout / checkin', t => {
  const el = new ElasticLedger({ limit: 5 })
  const ticket = el.checkout(1000)
  for (let i = 0; i < 10; i++) {
    el.append({ value: i })
  }
  t.is(el.records.length, 11)
  t.is(el.convolute().value, 45)

  el.checkin(ticket)
  t.is(el.records.length, 5)
  t.is(el.convolute().value, 45)
})