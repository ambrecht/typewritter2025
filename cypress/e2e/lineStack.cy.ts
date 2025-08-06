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
})
