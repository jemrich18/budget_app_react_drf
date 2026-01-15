from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    """Budget categories for income and expenses"""
    CATEGORY_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=CATEGORY_TYPES)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color for UI
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['-created_at']
        unique_together = ['user', 'name']  # Each user can't have duplicate category names

    def __str__(self):
        return f"{self.name} ({self.type}) - {self.user.username}"


class Transaction(models.Model):
    """Individual income or expense transactions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f"{self.date} - ${self.amount} - {self.category.name if self.category else 'No Category'}"

    @property
    def type(self):
        """Return the transaction type based on category"""
        return self.category.type if self.category else None


class Budget(models.Model):
    """Budget limits for specific categories"""
    PERIOD_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='monthly')
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['user', 'start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.category.name} - ${self.amount} ({self.period})"

    def get_spent_amount(self):
        """Calculate total spent in this budget period"""
        from django.db.models import Sum
        total = Transaction.objects.filter(
            user=self.user,
            category=self.category,
            date__gte=self.start_date,
            date__lte=self.end_date
        ).aggregate(Sum('amount'))['amount__sum']
        return total or 0

    def get_remaining_amount(self):
        """Calculate remaining budget"""
        return self.amount - self.get_spent_amount()

    def is_over_budget(self):
        """Check if budget limit is exceeded"""
        return self.get_spent_amount() > self.amount