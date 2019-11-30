class ElasticLedger {
  constructor(options={}) {
    this.limit = options.limit || 10
    this.defaultTimeout = options.defaultTimeout || 60 * 1000
    this.genesis = options.genesis || (() => ({ value: 0 }))
    this.reduce = options.reduce || ((convolution, record) => {
      if (record.carryOver) {
        convolution.value = record.value
      } else {
        convolution.value += record.value
      }
      return convolution
    })

    const genesis = this.genesis()
    this.records = [genesis]
    this.ticketNumber = 1
    this.tickets = {}
    this.elastic = false
  }

  append(record) {
    this.records.push(record)
    if (!this.elastic && this.records.length > this.limit) {
      this.carryOver()
    }
  }

  convolute(records) {
    records = records || this.records
    const genesis = this.genesis()
    const convolution = records.reduce(this.reduce, genesis)
    return convolution
  }

  carryOver() {
    const carriedOver = this.records.length - this.limit
    const carryOver = this.records.slice(0, carriedOver + 1)
    const convolution = this.convolute(carryOver)
    convolution.carryOver = true
    this.records.splice(0, carriedOver + 1, convolution)
  }

  checkout(timeout) {
    timeout = timeout || this.defaultTimeout
    const ticket = this.ticketNumber++
    this.tickets[ticket] = setTimeout(() => this.checkin(ticket), timeout)
    this.elastic = true
    return ticket
  }

  checkin(ticket) {
    const to = this.tickets[ticket]
    if (to) {
      try { clearTimeout(to) } catch(ex) {}
      delete this.tickets[ticket]
    }
    if (Object.keys(this.tickets).length < 1) {
      this.carryOver()
      this.elastic = false
    }
  }

  shutdown() {
    for (let to of Object.values(this.tickets)) {
      try { clearTimeout(to) } catch(ex) {}
    }
    this.tickets = {}
  }
}

module.exports = ElasticLedger