import os
import random
import string
import time
import unittest
from datetime import date, timedelta

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait


FRONTEND_URL = os.getenv("HRMS_FRONTEND_URL", "http://localhost:5173")
ADMIN_USERNAME = os.getenv("HRMS_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("HRMS_ADMIN_PASSWORD", "hrms@123")
EMPLOYEE_USERNAME = os.getenv("HRMS_EMPLOYEE_USERNAME", "pratheeksha538@gmail.com")
EMPLOYEE_PASSWORD = os.getenv("HRMS_EMPLOYEE_PASSWORD", "12345678")


class HRMSTest(unittest.TestCase):
    """HRMS Selenium smoke tests aligned with the current React UI."""

    @classmethod
    def setUpClass(cls):
        options = webdriver.ChromeOptions()
        options.add_argument("--ignore-certificate-errors")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        cls.driver = webdriver.Chrome(options=options)
        cls.driver.maximize_window()
        cls.driver.implicitly_wait(3)
        cls.wait = WebDriverWait(cls.driver, 20)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def setUp(self):
        self.driver.get(FRONTEND_URL)
        self.driver.delete_all_cookies()
        self.driver.execute_script("window.localStorage.clear();")
        self.driver.execute_script("window.sessionStorage.clear();")
        self.driver.get(FRONTEND_URL)
        self.wait_for_login_page()

    def wait_for_login_page(self):
        try:
            self.wait.until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "input[placeholder='Username or Email']")
                )
            )
        except TimeoutException:
            self.fail(
                f"Login page did not load at {FRONTEND_URL}. "
                "Make sure the frontend is running."
            )

    def wait_for_element(self, by, value):
        return self.wait.until(EC.presence_of_element_located((by, value)))

    def wait_for_clickable(self, by, value):
        return self.wait.until(EC.element_to_be_clickable((by, value)))

    def wait_for_text(self, text):
        return self.wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//*[contains(normalize-space(), '{text}')]")
            )
        )

    def safe_click(self, element):
        try:
            element.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", element)

    def set_date_input(self, name, value):
        element = self.wait_for_element(By.NAME, name)
        self.driver.execute_script(
            """
            const input = arguments[0];
            const value = arguments[1];
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            """,
            element,
            value,
        )

    def fill_login_form(self, username, password):
        username_input = self.wait_for_element(
            By.CSS_SELECTOR, "input[placeholder='Username or Email']"
        )
        username_input.clear()
        username_input.send_keys(username)

        password_input = self.wait_for_element(
            By.CSS_SELECTOR, "input[placeholder='Password']"
        )
        password_input.clear()
        password_input.send_keys(password)

        sign_in_button = self.wait_for_clickable(
            By.XPATH, "//button[@type='submit' and contains(., 'Sign In')]"
        )
        self.safe_click(sign_in_button)

    def login_admin(self):
        self.fill_login_form(ADMIN_USERNAME, ADMIN_PASSWORD)
        self.wait.until(EC.url_contains("/admin"))
        self.wait_for_text("HRMS Control Room")
        return True

    def login_employee(self):
        self.fill_login_form(EMPLOYEE_USERNAME, EMPLOYEE_PASSWORD)
        self.wait.until(EC.url_contains("/employee"))
        self.wait_for_text("Welcome")
        return True

    def generate_random_string(self, length=6):
        return "".join(random.choice(string.ascii_lowercase) for _ in range(length))

    def open_employee_tab(self, label):
        tab = self.wait_for_clickable(
            By.XPATH,
            f"//div[span[2][normalize-space()='{label}']]",
        )
        self.safe_click(tab)

    def future_dates(self, start_offset=2, end_offset=3):
        start = date.today() + timedelta(days=start_offset)
        end = date.today() + timedelta(days=end_offset)
        while start.weekday() >= 5:
            start += timedelta(days=1)
        while end <= start or end.weekday() >= 5:
            end += timedelta(days=1)
        return start.isoformat(), end.isoformat()

    def test_01_admin_login(self):
        self.assertTrue(self.login_admin(), "Admin login failed")

    def test_02_employee_login(self):
        self.assertTrue(self.login_employee(), "Employee login failed")

    def test_03_apply_leave(self):
        self.login_employee()
        self.open_employee_tab("Leave Requests")

        apply_btn = self.wait_for_clickable(
            By.XPATH, "//button[contains(., 'Apply for Leave')]"
        )
        self.safe_click(apply_btn)

        leave_type = self.wait_for_element(By.NAME, "leave_type")
        Select(leave_type).select_by_value("SICK")

        start_date, end_date = self.future_dates()
        self.set_date_input("start_date", start_date)
        self.set_date_input("end_date", end_date)
        self.wait_for_element(By.NAME, "reason").send_keys(
            "Medical appointment - Selenium Test"
        )

        submit_btn = self.wait_for_clickable(
            By.XPATH, "//button[@type='submit' and contains(., 'Apply Leave')]"
        )
        self.safe_click(submit_btn)

        self.wait.until(
            EC.presence_of_element_located(
                (By.XPATH, "//*[contains(normalize-space(), 'Medical appointment - Selenium Test')]")
            )
        )

    def test_04_admin_approve_leave(self):
        self.login_admin()
        self.driver.get(f"{FRONTEND_URL}/admin?section=leave-management")
        self.wait_for_text("Leave Management")

        approve_buttons = self.driver.find_elements(
            By.XPATH, "//button[contains(normalize-space(), 'Approve')]"
        )
        if approve_buttons:
            self.safe_click(approve_buttons[0])
            self.wait.until(
                EC.presence_of_element_located(
                    (
                        By.XPATH,
                        "//*[contains(normalize-space(), 'approved successfully') "
                        "or contains(normalize-space(), 'Leave approved successfully')]",
                    )
                )
            )

    def test_05_create_employee(self):
        self.login_admin()
        self.driver.get(f"{FRONTEND_URL}/admin?section=employees")
        self.wait_for_text("Employees Management")

        random_suffix = self.generate_random_string(4)
        test_email = f"test_{random_suffix}@company.com"

        self.safe_click(
            self.wait_for_clickable(By.XPATH, "//button[contains(., 'New Employee')]")
        )

        self.wait_for_element(By.NAME, "first_name").send_keys("Test")
        self.wait_for_element(By.NAME, "last_name").send_keys(f"User{random_suffix}")
        Select(self.wait_for_element(By.NAME, "gender")).select_by_value("MALE")
        Select(self.wait_for_element(By.NAME, "marital_status")).select_by_value("SINGLE")
        Select(self.wait_for_element(By.NAME, "education")).select_by_value("BACHELORS")
        self.wait_for_element(By.NAME, "email").send_keys(test_email)
        self.wait_for_element(By.NAME, "phone").send_keys(
            f"99{random.randint(10000000, 99999999)}"
        )
        self.wait_for_element(By.NAME, "address").send_keys("123 Test Street, Test City")
        self.wait_for_element(By.NAME, "department").send_keys("IT")
        self.wait_for_element(By.NAME, "designation").send_keys("Software Tester")
        self.set_date_input("joining_date", date.today().isoformat())

        submit_btn = self.wait_for_clickable(
            By.XPATH, "//button[@type='submit' and contains(., 'Create Employee')]"
        )
        self.safe_click(submit_btn)

        self.wait.until(
            EC.invisibility_of_element_located(
                (By.XPATH, "//h2[contains(., 'Add New Employee')]")
            )
        )

    def test_06_search_employees(self):
        self.login_admin()
        self.driver.get(f"{FRONTEND_URL}/admin?section=employees")
        self.wait_for_text("Employee List")

        search_box = self.wait_for_element(
            By.XPATH, "//input[@placeholder='Search by any field...']"
        )
        search_box.clear()
        search_box.send_keys("admin")
        time.sleep(1)

        clear_btn = self.wait_for_clickable(
            By.XPATH, "//button[contains(., 'Clear Search')]"
        )
        self.safe_click(clear_btn)

    def test_07_logout(self):
        self.login_admin()
        logout_btn = self.wait_for_clickable(
            By.XPATH, "//button[contains(., 'Logout')]"
        )
        self.safe_click(logout_btn)
        self.wait_for_login_page()

    def test_08_forgot_password(self):
        forgot_link = self.wait_for_clickable(
            By.XPATH, "//button[contains(., 'Forgot password?')]"
        )
        self.safe_click(forgot_link)

        email_input = self.wait_for_element(
            By.XPATH, "//input[@placeholder='Enter your email']"
        )
        email_input.send_keys("admin@example.com")

        send_btn = self.wait_for_clickable(
            By.XPATH, "//button[contains(., 'Send Reset Link')]"
        )
        self.safe_click(send_btn)

        back_btn = self.wait_for_clickable(
            By.XPATH, "//button[contains(., 'Back to Login')]"
        )
        self.safe_click(back_btn)
        self.wait_for_login_page()

    def test_09_announcement_view(self):
        self.login_employee()
        self.open_employee_tab("Announcements")
        self.wait_for_text("Announcements")

    def test_10_profile_view(self):
        self.login_employee()
        self.open_employee_tab("My Profile")
        self.wait_for_text("Personal Information")

    def test_11_attendance_view(self):
        self.login_employee()
        self.open_employee_tab("Attendance")
        self.wait_for_text("Attendance History")

    def test_12_salary_view(self):
        self.login_employee()
        self.open_employee_tab("Salary")
        self.wait_for_text("Salary")


def run_quick_test():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--ignore-certificate-errors")

    driver = webdriver.Chrome(options=options)
    driver.get(FRONTEND_URL)
    time.sleep(2)

    print(f"Page title: {driver.title}")
    print(f"Current URL: {driver.current_url}")

    page_source = driver.page_source.lower()
    if "username or email" in page_source and "password" in page_source:
        print("Login page loaded successfully")
    else:
        print("Login page may not have loaded correctly")

    driver.quit()


if __name__ == "__main__":
    print("=" * 70)
    print("STARTING HRMS SELENIUM AUTOMATION TESTS")
    print("=" * 70)
    print("\nMake sure:")
    print("  1. Django backend is running on port 8000")
    print("  2. React frontend is running on port 5173")
    print("  3. The admin and employee accounts exist")
    print("  4. Override credentials with HRMS_* env vars if needed")
    print("=" * 70)

    run_quick_test()
    unittest.main(verbosity=2, failfast=False)
