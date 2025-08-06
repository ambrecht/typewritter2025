describe("Active line visibility", () => {
  it("stays in view after 500 inputs", () => {
    cy.visit("/")
    cy.get('#hidden-input').focus()
    const input = "a{enter}"
    for (let i = 0; i < 500; i++) {
      cy.focused().type(input, { delay: 0 })
    }
    cy.get('[data-testid="active-line"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect()
      expect(rect.bottom).to.be.lte(window.innerHeight)
    })
  })
})
