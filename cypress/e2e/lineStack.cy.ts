describe("Line stack behavior", () => {
  it("keeps input visible without scrollbars or key warnings after 500 lines", () => {
    cy.visit("/")
    cy.window().then((win) => {
      cy.spy(win.console, "error").as("consoleError")
    })
    cy.get('#hidden-input').focus()
    const input = "a{enter}"
    for (let i = 0; i < 500; i++) {
      cy.focused().type(input, { delay: 0 })
    }
    cy.get('[data-testid="active-line"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect()
      expect(rect.bottom).to.be.lte(window.innerHeight)
    })
    cy.get('.line-stack').then(($el) => {
      const el = $el[0]
      expect(el.scrollHeight).to.equal(el.clientHeight)
    })
    cy.get('@consoleError').should('not.have.been.calledWithMatch', /key/i)
  })

  it("adjusts visible lines based on viewport height", () => {
    cy.viewport(1000, 500)
    cy.visit("/")
    cy.get('#hidden-input').focus()
    for (let i = 0; i < 100; i++) {
      cy.focused().type(`line${i}{enter}`, { delay: 0 })
    }
    cy.get('.line-stack > div').should('have.length', 20)
    cy.viewport(1000, 1000)
    cy.wait(100)
    cy.get('.line-stack > div').its('length').should('be.gt', 20)
  })

  it("changes only the slice on arrow navigation without scrollbars", () => {
    cy.visit("/")
    cy.get('#hidden-input').focus()
    for (let i = 0; i < 100; i++) {
      cy.focused().type(`line${i}{enter}`, { delay: 0 })
    }
    cy.get('.line-stack > div').its('length').as('visibleCount')
    cy.get('.line-stack > div').first().invoke('text').as('firstLine')
    cy.get('.line-stack').then(($el) => {
      const el = $el[0]
      expect(el.scrollHeight).to.equal(el.clientHeight)
    })
    cy.get('#hidden-input').type('{uparrow}{uparrow}')
    cy.get('@visibleCount').then((count) => {
      cy.get('.line-stack > div').should('have.length', count as number)
    })
    cy.get('@firstLine').then((before) => {
      cy.get('.line-stack > div').first().invoke('text').should('not.eq', before)
    })
    cy.get('.line-stack').then(($el) => {
      const el = $el[0]
      expect(el.scrollHeight).to.equal(el.clientHeight)
    })
    cy.get('#hidden-input').type('{downarrow}')
    cy.get('@firstLine').then((before) => {
      cy.get('.line-stack > div').first().invoke('text').should('eq', before)
    })
    cy.get('.line-stack').then(($el) => {
      const el = $el[0]
      expect(el.scrollHeight).to.equal(el.clientHeight)
    })
  })
})
