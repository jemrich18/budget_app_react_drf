# Budget App

A full-stack budgeting web application that lets users track income and expenses, categorize transactions, and see their balance and spending insights at a glance.

## Live Demo

- App: https://budgetappreactdrf-production.up.railway.app

Demo account (read-only sample data):

- Username: demo_user  
- Password: DemoPass123!

## Features

- User authentication (register, login, logout) with protected dashboard.
- Summary cards for total income, total expenses, and current balance.
- Categories management with type (income/expense), color, and description.
- Transaction management: create, view, and delete transactions with date, amount, description, and category.
- Recent transactions table with income/expense styling and delete action.
- Date filter for transactions (all time, this month, last month).
- “Expenses by category” chart using Recharts for quick visual insights.
- Mobile-friendly, responsive layout built with Tailwind CSS.

## Tech Stack

- Frontend: React, React Router, Recharts, Tailwind CSS
- Backend: Django, Django REST Framework
- Database: SQLite (development)
- Auth: Token-based authentication (Django REST)
- Deployment: Railway

## Running Locally

### Backend

```bash
git clone https://github.com/jemrich18/budget_app_react_drf
cd budget_app_react_drf

# create and activate virtualenv if needed
python -m venv ven
ven\Scripts\activate  # Windows

python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
