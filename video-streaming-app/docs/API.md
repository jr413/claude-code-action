# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Auth Endpoints

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "johndoe",
  "full_name": "John Doe",
  "birthDate": "1990-01-01"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "plan_type": "free"
  },
  "token": "jwt_token"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "plan_type": "standard"
  },
  "token": "jwt_token"
}
```

#### POST /auth/verify-email
Verify email address.

**Request Body:**
```json
{
  "token": "verification_token"
}
```

#### POST /auth/request-password-reset
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "newpassword"
}
```

### User Endpoints

#### GET /users/profile
Get current user profile. (Authenticated)

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "role": "user",
  "plan_type": "standard",
  "plan_expires_at": "2024-12-31T23:59:59Z",
  "stats": {
    "videos_watched": 42,
    "videos_completed": 35,
    "favorites_count": 12,
    "likes_given": 28
  }
}
```

#### PUT /users/profile
Update user profile. (Authenticated)

**Request Body:**
```json
{
  "username": "newusername",
  "full_name": "New Name"
}
```

#### PUT /users/change-password
Change password. (Authenticated)

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
```

#### GET /users/usage
Get usage statistics. (Authenticated)

**Response:**
```json
{
  "current_usage": {
    "videos_watched": 10,
    "watch_time_hours": 25
  },
  "limits": {
    "monthly_videos": 20,
    "max_quality": "720p"
  },
  "plan": {
    "type": "standard",
    "expires_at": "2024-12-31T23:59:59Z"
  },
  "remaining": 10
}
```

#### GET /users/recommendations
Get personalized recommendations. (Authenticated)

**Query Parameters:**
- `limit` (optional): Number of recommendations (default: 10)

### Content Endpoints

#### GET /content/categories
Get all categories.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Entertainment",
    "slug": "entertainment",
    "description": "General entertainment content",
    "thumbnail_url": "https://example.com/thumb.jpg"
  }
]
```

#### GET /content/creators
Get creators with filters.

**Query Parameters:**
- `category` (optional): Filter by category ID
- `featured` (optional): Filter featured creators
- `plan` (optional): Filter by required plan
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "creators": [
    {
      "id": "uuid",
      "name": "Creator Name",
      "slug": "creator-name",
      "bio": "Creator bio",
      "thumbnail_url": "https://example.com/thumb.jpg",
      "category_name": "Entertainment",
      "plan_required": "free",
      "is_featured": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### GET /content/creators/:identifier
Get single creator by ID or slug.

#### GET /content/videos
Get videos with filters.

**Query Parameters:**
- `creator` (optional): Filter by creator ID
- `category` (optional): Filter by category ID
- `plan` (optional): Filter by required plan
- `status` (optional): Filter by status (default: published)
- `search` (optional): Search in title and description
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "videos": [
    {
      "id": "uuid",
      "title": "Video Title",
      "slug": "video-title",
      "thumbnail_url": "https://example.com/thumb.jpg",
      "creator_name": "Creator Name",
      "duration_seconds": 1800,
      "view_count": 1234,
      "plan_required": "free"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 200,
    "pages": 10
  }
}
```

#### GET /content/videos/:id
Get single video. (Authenticated)

### Video Endpoints

#### GET /videos/stream/:videoId
Get video stream URL. (Authenticated)

**Query Parameters:**
- `position` (optional): Resume position in seconds

**Response:**
```json
{
  "type": "hls",
  "url": "https://cdn.example.com/video.m3u8",
  "fallback_url": "https://cdn.example.com/video.mp4",
  "duration": 1800,
  "quality": "720p"
}
```

#### POST /videos/progress/:videoId
Update watch progress. (Authenticated)

**Request Body:**
```json
{
  "position": 600,
  "duration": 1800
}
```

#### GET /videos/history
Get watch history. (Authenticated)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

#### POST /videos/like/:videoId
Toggle like on video. (Authenticated)

**Response:**
```json
{
  "liked": true
}
```

#### POST /videos/favorite/:videoId
Toggle favorite on video. (Authenticated)

**Response:**
```json
{
  "favorited": true
}
```

#### GET /videos/favorites
Get user's favorite videos. (Authenticated)

### Payment Endpoints

#### POST /payments/create-checkout-session
Create Stripe checkout session. (Authenticated)

**Request Body:**
```json
{
  "plan": "standard",
  "interval": "monthly"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST /payments/webhook
Stripe webhook endpoint. (Used by Stripe)

#### GET /payments/subscription
Get current subscription. (Authenticated)

**Response:**
```json
{
  "plan_type": "standard",
  "plan_expires_at": "2024-12-31T23:59:59Z",
  "subscription": {
    "id": "uuid",
    "status": "active",
    "current_period_end": "2024-12-31T23:59:59Z",
    "cancel_at_period_end": false
  }
}
```

#### POST /payments/cancel-subscription
Cancel subscription at period end. (Authenticated)

#### GET /payments/payments
Get payment history. (Authenticated)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "status": "error"
}
```

Common HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

API requests are rate limited to 100 requests per 15 minutes per IP address.