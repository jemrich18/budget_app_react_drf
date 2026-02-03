import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI, transactionsAPI } from '../services/api';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    color: '#3B82F6',
    description: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    category: '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [dateFilter, setDateFilter] = useState('all');

  const fetchSummary = useCallback(async () => {
    try {
      const response = await transactionsAPI.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await transactionsAPI.getAll();
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        fetchSummary(),
        fetchCategories(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [fetchSummary, fetchCategories, fetchTransactions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await categoriesAPI.create(categoryForm);
      setCategoryForm({ name: '', type: 'expense', color: '#3B82F6', description: '' });
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.create(transactionForm);
      setTransactionForm({
        category: '',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setShowTransactionForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionsAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const filteredTransactions = transactions.filter((trans) => {
  if (dateFilter === 'all') return true;

  const txDate = new Date(trans.date);
  const now = new Date();

  if (dateFilter === 'this_month') {
    return (
      txDate.getMonth() === now.getMonth() &&
      txDate.getFullYear() === now.getFullYear()
    );
  }

  if (dateFilter === 'last_month') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      txDate.getMonth() === lastMonth.getMonth() &&
      txDate.getFullYear() === lastMonth.getFullYear()
    );
  }

  return true;
});

// Build expenses-by-category data for chart
const expensesByCategory = filteredTransactions
  .filter((t) => t.category_type === 'expense')
  .reduce((acc, t) => {
    const key = t.category_name || 'Uncategorized';
    acc[key] = (acc[key] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

const expenseChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
  name,
  value,
}));

const chartColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#6366F1', '#EC4899'];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Budget App</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {user?.username || 'User'}!
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-800">Income</h3>
            <p className="text-3xl font-bold text-green-600">
              ${summary.income.toFixed(2)}
            </p>
          </div>
          {/* Expenses by Category Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-xl font-semibold mb-4">Expenses by category</h3>
            {expenseChartData.length === 0 ? (
              <p className="text-gray-500 text-sm">No expense data yet.</p>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
        </div>
          
          <div className="bg-red-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-red-800">Expenses</h3>
            <p className="text-3xl font-bold text-red-600">
              ${summary.expenses.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-blue-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-800">Balance</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${summary.balance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {showCategoryForm ? 'Hide' : 'Add Category'}
          </button>
          <button
            onClick={() => setShowTransactionForm(!showTransactionForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={categories.length === 0}
          >
            {showTransactionForm ? 'Hide' : 'Add Transaction'}
          </button>
        </div>

        {/* Category Form */}
        {showCategoryForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-xl font-semibold mb-4">New Category</h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label>Type *</label>
                  <select
                    value={categoryForm.type}
                    onChange={(e) => setCategoryForm({...categoryForm, type: e.target.value})}
                    required
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label>Color</label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                  />
                </div>
                <div>
                  <label>Description</label>
                  <input
                    type="text"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Save Category
              </button>
            </form>
          </div>
        )}

        {/* Transaction Form */}
        {showTransactionForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-xl font-semibold mb-4">New Transaction</h3>
            <form onSubmit={handleTransactionSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Category *</label>
                  <select
                    value={transactionForm.category}
                    onChange={(e) => setTransactionForm({...transactionForm, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label>Date *</label>
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label>Description</label>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Save Transaction
              </button>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-semibold mb-4">Categories ({categories.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="border p-4 rounded" style={{borderLeft: `4px solid ${cat.color}`}}>
                <h4 className="font-semibold">{cat.name}</h4>
                <p className="text-sm text-gray-600">{cat.type}</p>
                <p className="text-xs text-gray-500">{cat.transaction_count} transactions</p>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-500">No categories yet. Create one to get started!</p>
            )}
          </div>
        </div>

        
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Recent Transactions</h3>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All time</option>
              <option value="this_month">This month</option>
              <option value="last_month">Last month</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 10).map(trans => (
                  <tr key={trans.id} className="border-b">
                    <td className="px-4 py-2">{trans.date}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        trans.category_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trans.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-2">{trans.description || '-'}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${
                      trans.category_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trans.category_type === 'income' ? '+' : '-'}${parseFloat(trans.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDeleteTransaction(trans.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No transactions for this period. Try a different date filter or add a new transaction</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;