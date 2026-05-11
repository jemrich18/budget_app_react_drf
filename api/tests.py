import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Transaction, Budget
from datetime import date

class CategoryModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(
            name='Food',
            type='expense',
            user=self.user
        )

    def test_category_created(self):
        self.assertEqual(self.category.name, 'Food')

    def test_category_type(self):
        self.assertEqual(self.category.type, 'expense')

    def test_category_str(self):
        self.assertIn('Food', str(self.category))

class TransactionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2',
            password='testpass123'
        )
        self.category = Category.objects.create(
            name='Transport',
            type='expense',
            user=self.user
        )
        self.transaction = Transaction.objects.create(
            user=self.user,
            category=self.category,
            amount=25.00,
            date=date.today(),
            description='Bus ticket'
        )

    def test_transaction_created(self):
        self.assertEqual(float(self.transaction.amount), 25.00)

    def test_transaction_type(self):
        self.assertEqual(self.transaction.type, 'expense')

    def test_transaction_str(self):
        self.assertIn('25.0', str(self.transaction))

class BudgetModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser3',
            password='testpass123'
        )
        self.category = Category.objects.create(
            name='Groceries',
            type='expense',
            user=self.user
        )
        self.budget = Budget.objects.create(
            user=self.user,
            category=self.category,
            amount=500.00,
            period='monthly',
            start_date=date.today(),
            end_date=date(date.today().year, date.today().month, 28)
        )

    def test_budget_created(self):
        self.assertEqual(float(self.budget.amount), 500.00)

    def test_budget_not_over(self):
        self.assertFalse(self.budget.is_over_budget())

    def test_budget_remaining(self):
        self.assertEqual(float(self.budget.get_remaining_amount()), 500.00)

class CategoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='apiuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_category(self):
        response = self.client.post('/api/categories/', {
            'name': 'Groceries',
            'type': 'expense',
            'color': '#3B82F6'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_categories(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TransactionAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='transuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(
            name='Food',
            type='expense',
            user=self.user
        )

    def test_create_transaction(self):
        response = self.client.post('/api/transactions/', {
            'amount': 15.00,
            'category': self.category.id,
            'date': date.today(),
            'description': 'Lunch'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_transactions(self):
        response = self.client.get('/api/transactions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/transactions/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)