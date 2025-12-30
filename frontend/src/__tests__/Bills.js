/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js"
import Bills from "../containers/Bills.js"
import router from "../app/Router.js";
import '@testing-library/jest-dom'

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on the new bill button", () => {
      test("Then it should navigate to NewBill page", () => {
        const onNavigate = jest.fn()
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage
        })

        const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill)
        const newBillBtn = document.querySelector(`button[data-testid="btn-new-bill"]`)
        
        if (newBillBtn) {
          newBillBtn.addEventListener('click', handleClickNewBill)
          newBillBtn.click()
          expect(handleClickNewBill).toHaveBeenCalled()
          expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
        }
      })
    })

    describe("When I click on the eye icon", () => {
      test("Then a modal should open", () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        document.body.innerHTML = BillsUI({ data: bills })

        const onNavigate = jest.fn()
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage
        })

        $.fn.modal = jest.fn()
        
        const iconEye = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))
        
        iconEye.addEventListener('click', handleClickIconEye)
        iconEye.click()
        
        expect(handleClickIconEye).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalledWith('show')
      })
    })

  })
})
