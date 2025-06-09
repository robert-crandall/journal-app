#!/usr/bin/env bash

# Simple API test script for development
# Run this after starting the server to verify endpoints

API_BASE="http://localhost:3001/api"

echo "🧪 Testing Journal App API..."
echo ""

# Test health check
echo "📡 Testing health check..."
curl -s "$API_BASE/../" | jq '.'
echo ""

# Test auth endpoints (these will fail without credentials, but should return proper error structure)
echo "🔐 Testing auth endpoints..."
echo "Register endpoint (should return validation error):"
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

echo "Login endpoint (should return validation error):"
curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

echo "Me endpoint (should return auth required):"
curl -s "$API_BASE/auth/me" | jq '.'
echo ""

# Test journal endpoints (these should require auth)
echo "📝 Testing journal endpoints..."
echo "Start journal (should return auth required):"
curl -s -X POST "$API_BASE/journal/start" | jq '.'
echo ""

echo "Journal list (should return auth required):"
curl -s "$API_BASE/journal/list" | jq '.'
echo ""

echo "✅ API test complete!"
echo "If you see proper error responses, the API is working correctly."
