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

// GET Bills
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const billType = await screen.getByText("Hôtel et logement")
      expect(billType).toBeTruthy()
      const billName = await screen.getByText("encore")
      expect(billName).toBeTruthy()
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur/)
        expect(message).toBeTruthy()
      })
    })

  })
})

// GET Bills unit tests
describe("Given I am connected as Employee", () => {
  describe("When I call getBills method", () => {
    test("Then it should return formatted bills", async () => {
      jest.restoreAllMocks()
      
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })

      const result = await billsContainer.getBills()
      
      expect(result.length).toBe(4)
      expect(result[0].date).toBe("4 Avr. 04")
      expect(result[0].status).toBe("En attente")
      expect(result[1].date).toBe("1 Jan. 01")
      expect(result[1].status).toBe("Refusé")
    })

    test("Then it should handle corrupted date and log error", async () => {
      const corruptedStore = {
        bills() {
          return {
            list() {
              return Promise.resolve([
                {
                  id: "1",
                  date: "invalid-date",
                  status: "pending",
                  name: "Test"
                }
              ])
            }
          }
        }
      }

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: corruptedStore,
        localStorage: window.localStorage
      })

      const consoleSpy = jest.spyOn(console, 'log')
      const result = await billsContainer.getBills()
      
      expect(result.length).toBe(1)
      expect(result[0].date).toBe("invalid-date")
      expect(result[0].status).toBe("En attente")
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
