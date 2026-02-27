#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for QZap AI Quiz App
Tests all API endpoints including auth, OCR, quiz generation, and social features
"""

import requests
import sys
import json
import base64
from datetime import datetime
import os
from pathlib import Path

class QZapAPITester:
    def __init__(self):
        # Use the backend URL from the review request
        self.base_url = "https://ai-quiz-master-4.preview.emergentagent.com/api"
        self.access_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data - Use proper email format for Supabase
        self.test_timestamp = datetime.now().strftime('%H%M%S')
        self.test_email = f"test.user.{self.test_timestamp}@gmail.com"
        self.test_password = "TestPassword123!"
        self.test_name = f"Test User {self.test_timestamp}"
    
    def log_test(self, name, status, details=None):
        """Log test results"""
        self.tests_run += 1
        if status == "PASS":
            self.tests_passed += 1
            print(f"✅ {name}")
        elif status == "FAIL":
            print(f"❌ {name} - {details}")
        elif status == "SKIP":
            print(f"⏭️  {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "status": status,
            "details": details
        })
    
    def make_request(self, method, endpoint, data=None, files=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    # Remove content-type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
            
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_root_endpoint(self):
        """Test the root API endpoint"""
        response, error = self.make_request('GET', '/')
        if error:
            self.log_test("Root API endpoint", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data and "QZap" in data["message"]:
                    self.log_test("Root API endpoint", "PASS")
                    return True
                else:
                    self.log_test("Root API endpoint", "FAIL", f"Unexpected response: {data}")
                    return False
            except:
                self.log_test("Root API endpoint", "FAIL", "Invalid JSON response")
                return False
        else:
            self.log_test("Root API endpoint", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response, error = self.make_request('GET', '/health')
        if error:
            self.log_test("Health endpoint", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health endpoint", "PASS")
                    return True
                else:
                    self.log_test("Health endpoint", "FAIL", f"Unexpected response: {data}")
                    return False
            except:
                self.log_test("Health endpoint", "FAIL", "Invalid JSON response")
                return False
        else:
            self.log_test("Health endpoint", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_signup(self):
        """Test user signup"""
        signup_data = {
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        }
        
        response, error = self.make_request('POST', '/auth/signup', signup_data)
        if error:
            self.log_test("User signup", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "user" in data and data["user"]["email"] == self.test_email:
                    # Store access token if provided
                    if "access_token" in data:
                        self.access_token = data["access_token"]
                        self.user_id = data["user"]["id"]
                    self.log_test("User signup", "PASS")
                    return True
                else:
                    self.log_test("User signup", "FAIL", f"Unexpected response: {data}")
                    return False
            except Exception as e:
                self.log_test("User signup", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            try:
                error_data = response.json()
                self.log_test("User signup", "FAIL", f"Status {response.status_code}: {error_data.get('detail', 'Unknown error')}")
            except:
                self.log_test("User signup", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response, error = self.make_request('POST', '/auth/login', login_data)
        if error:
            self.log_test("User login", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("User login", "PASS")
                    return True
                else:
                    self.log_test("User login", "FAIL", f"Missing token or user data: {data}")
                    return False
            except Exception as e:
                self.log_test("User login", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            try:
                error_data = response.json()
                self.log_test("User login", "FAIL", f"Status {response.status_code}: {error_data.get('detail', 'Unknown error')}")
            except:
                self.log_test("User login", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_get_me(self):
        """Test get current user endpoint"""
        if not self.access_token:
            self.log_test("Get current user", "SKIP", "No access token")
            return False
        
        response, error = self.make_request('GET', '/auth/me')
        if error:
            self.log_test("Get current user", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_test("Get current user", "PASS")
                    return True
                else:
                    self.log_test("Get current user", "FAIL", f"Missing user data: {data}")
                    return False
            except Exception as e:
                self.log_test("Get current user", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            self.log_test("Get current user", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_dashboard(self):
        """Test dashboard endpoint"""
        if not self.access_token:
            self.log_test("Dashboard", "SKIP", "No access token")
            return False
        
        response, error = self.make_request('GET', '/dashboard')
        if error:
            self.log_test("Dashboard", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "stats" in data and "recent_quizzes" in data:
                    self.log_test("Dashboard", "PASS")
                    return True
                else:
                    self.log_test("Dashboard", "FAIL", f"Missing dashboard data: {data}")
                    return False
            except Exception as e:
                self.log_test("Dashboard", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            self.log_test("Dashboard", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_ocr_endpoint(self):
        """Test OCR endpoint with sample image"""
        if not self.access_token:
            self.log_test("OCR endpoint", "SKIP", "No access token")
            return False
        
        # Create a simple test image (base64 encoded)
        # This is a minimal PNG image (1x1 pixel transparent)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        ocr_data = {
            "image_base64": test_image_b64,
            "language": "en"
        }
        
        response, error = self.make_request('POST', '/ocr', ocr_data)
        if error:
            self.log_test("OCR endpoint", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "text" in data:
                    self.log_test("OCR endpoint", "PASS")
                    return True
                else:
                    self.log_test("OCR endpoint", "FAIL", f"Missing text field: {data}")
                    return False
            except Exception as e:
                self.log_test("OCR endpoint", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            # OCR might fail with a simple test image, which is acceptable
            self.log_test("OCR endpoint", "FAIL", f"Status code: {response.status_code} (might fail with test image)")
            return False
    
    def test_quiz_generate(self):
        """Test quiz generation endpoint"""
        if not self.access_token:
            self.log_test("Quiz generation", "SKIP", "No access token")
            return False
        
        quiz_data = {
            "text": "The solar system has eight planets. Mercury is the closest to the sun. Earth is the third planet from the sun.",
            "difficulty": "medium",
            "num_questions": 2,
            "language": "en"
        }
        
        response, error = self.make_request('POST', '/quiz/generate', quiz_data)
        if error:
            self.log_test("Quiz generation", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "quiz" in data and "questions" in data["quiz"]:
                    questions = data["quiz"]["questions"]
                    if len(questions) > 0:
                        self.log_test("Quiz generation", "PASS")
                        return True
                    else:
                        self.log_test("Quiz generation", "FAIL", "No questions generated")
                        return False
                else:
                    self.log_test("Quiz generation", "FAIL", f"Missing quiz data: {data}")
                    return False
            except Exception as e:
                self.log_test("Quiz generation", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            self.log_test("Quiz generation", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        if not self.access_token:
            self.log_test("Leaderboard", "SKIP", "No access token")
            return False
        
        response, error = self.make_request('GET', '/leaderboard')
        if error:
            self.log_test("Leaderboard", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "leaders" in data and "my_rank" in data:
                    self.log_test("Leaderboard", "PASS")
                    return True
                else:
                    self.log_test("Leaderboard", "FAIL", f"Missing leaderboard data: {data}")
                    return False
            except Exception as e:
                self.log_test("Leaderboard", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            self.log_test("Leaderboard", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_friends_endpoints(self):
        """Test friends-related endpoints"""
        if not self.access_token:
            self.log_test("Friends endpoints", "SKIP", "No access token")
            return False
        
        # Test get friends
        response, error = self.make_request('GET', '/friends')
        if error:
            self.log_test("Friends endpoints", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "friends" in data and "pending_requests" in data:
                    self.log_test("Friends endpoints", "PASS")
                    return True
                else:
                    self.log_test("Friends endpoints", "FAIL", f"Missing friends data: {data}")
                    return False
            except Exception as e:
                self.log_test("Friends endpoints", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            self.log_test("Friends endpoints", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def test_groups_endpoints(self):
        """Test groups-related endpoints"""
        if not self.access_token:
            self.log_test("Groups endpoints", "SKIP", "No access token")
            return False
        
        # Test get groups
        response, error = self.make_request('GET', '/groups')
        if error:
            self.log_test("Groups endpoints", "FAIL", error)
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):  # Groups endpoint returns array
                    self.log_test("Groups endpoints", "PASS")
                    return True
                else:
                    self.log_test("Groups endpoints", "FAIL", f"Expected array, got: {type(data)}")
                    return False
            except Exception as e:
                self.log_test("Groups endpoints", "FAIL", f"JSON parsing error: {str(e)}")
                return False
        else:
            self.log_test("Groups endpoints", "FAIL", f"Status code: {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🧪 Starting QZap API Tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_health_endpoint()
        
        # Auth flow tests
        self.test_signup()
        if not self.access_token:
            self.test_login()
        
        # Authenticated endpoints
        self.test_get_me()
        self.test_dashboard()
        
        # Core functionality tests
        self.test_ocr_endpoint()
        self.test_quiz_generate()
        self.test_leaderboard()
        
        # Social feature tests
        self.test_friends_endpoints()
        self.test_groups_endpoints()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check logs above.")
            return False

def main():
    """Main function"""
    tester = QZapAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())