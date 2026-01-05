/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import { ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })

    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains('active-icon')).toBe(true)
    })
  })

  describe("When I upload a file", () => {
    test("Then handleChangeFile should be called", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      document.body.innerHTML = NewBillUI()

      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const fileInput = screen.getByTestId("file")
      fileInput.addEventListener("change", handleChangeFile)
      
      fireEvent.change(fileInput)

      expect(handleChangeFile).toHaveBeenCalled()
    })
  })

  describe("When I submit the form with valid data", () => {
    test("Then it should call handleSubmit and navigate to Bills", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      document.body.innerHTML = NewBillUI()

      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const handleSubmit = jest.fn(newBill.handleSubmit)
      const form = screen.getByTestId("form-new-bill")
      
      form.addEventListener("submit", handleSubmit)

      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: 'Vol Paris Londres' } })
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: '2024-12-30' } })
      fireEvent.change(screen.getByTestId("amount"), { target: { value: '350' } })
      fireEvent.change(screen.getByTestId("vat"), { target: { value: '70' } })
      fireEvent.change(screen.getByTestId("pct"), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: 'Test commentary' } })

      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })
  })

  // POST integration test
  describe("When I submit a new bill", () => {
    test("Then it should create a new bill via POST API call", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      document.body.innerHTML = NewBillUI()

      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const form = screen.getByTestId("form-new-bill")
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: 'Vol Paris Londres' } })
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: '2024-12-30' } })
      fireEvent.change(screen.getByTestId("amount"), { target: { value: '350' } })
      fireEvent.change(screen.getByTestId("vat"), { target: { value: '70' } })
      fireEvent.change(screen.getByTestId("pct"), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: 'Test POST integration' } })

      const createSpy = jest.spyOn(mockStore, 'bills')

      await waitFor(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })

      expect(createSpy).toHaveBeenCalled()
    })

    test("Then it should handle 404 error from POST API", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      document.body.innerHTML = NewBillUI()

      const onNavigate = jest.fn()
      
      const storeMock404 = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error('404'))),
          update: jest.fn(() => Promise.reject(new Error('404')))
        }))
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock404,
        localStorage: window.localStorage
      })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const form = screen.getByTestId("form-new-bill")
      
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener("submit", handleSubmit)

      fireEvent.submit(form)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })

    test("Then it should handle 500 error from POST API", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      document.body.innerHTML = NewBillUI()

      const onNavigate = jest.fn()
      
      const storeMock500 = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error('500'))),
          update: jest.fn(() => Promise.reject(new Error('500')))
        }))
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock500,
        localStorage: window.localStorage
      })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const form = screen.getByTestId("form-new-bill")
      
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener("submit", handleSubmit)

      fireEvent.submit(form)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
