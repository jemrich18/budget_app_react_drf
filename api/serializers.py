from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token 
from .models import Category, Transaction, Budget

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'},
        min_length=8
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}, 
        label='Confirm Password'
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate(self, attrs):
        """Check that passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def validate_email(self, value):
        """Check that email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        """Create user and generate auth token"""
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        # Create auth token for the user
        Token.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True, 
        style={'input_type': 'password'}
    )

class CategorySerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'color', 'description', 'created_at', 'transaction_count']
        read_only_fields = ['id', 'created_at']
    
    def get_transaction_count(self, obj):
        return obj.transactions.count()

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.type', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'category', 'category_name', 'category_type', 'amount', 'description', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    
    def get_spent(self, obj):
        return float(obj.get_spent_amount())
    
    def get_remaining(self, obj):
        return float(obj.get_remaining_amount())
    
    class Meta:
        model = Budget
        fields = ['id', 'category', 'category_name', 'amount', 'spent', 'remaining', 'period', 'start_date', 'end_date']
        read_only_fields = ['id']