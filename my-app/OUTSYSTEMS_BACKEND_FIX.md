# How to Fix Your OutSystems Backend API

## The Problem

Your OutSystems REST API is receiving requests successfully (HTTP 200) but **returning an empty response body** with no JSON.

**Evidence from logs:**
```
[API Response] { status: 200, statusText: "", contentType: null }
[API Response Text]  (empty)
```

This means the REST API action in OutSystems is not configured to return a proper JSON response.

## Solution: Configure OutSystems REST API to Return JSON

### Step 1: Open Your REST API in OutSystems Service Studio

1. Open **OutSystems Service Studio**
2. Navigate to your **UserAuth_API** module
3. Go to **Logic** → **Integrations** → **REST** → **UserAuthAPI**
4. Open the **Login** method

### Step 2: Configure the Response Structure

#### A. Define the Response Structure

1. In the **Login** REST method, go to the **Response** section
2. Set **Response Format** to `JSON`
3. Define the output structure:

**Create a Structure named `LoginResponse`:**
```
LoginResponse (Structure)
├── Success (Boolean)
├── Message (Text)
├── Token (Text)
└── User (UserDetails Structure)
    ├── UserId (Text)
    ├── Name (Text)
    ├── Email (Text)
    └── PhoneNumber (Text)
```

#### B. Set the Response Output Parameter

1. In the **Login** method properties
2. Under **Response**, add an **Output Parameter**:
   - Name: `Response`
   - Data Type: `LoginResponse` (the structure you created)
3. Set **Response Content Type** to `application/json`

### Step 3: Implement the Login Server Action Logic

Your **Login** server action should look like this:

```
Login Server Action:
Input Parameters:
  - RequestData (LoginRequest structure)
    - Email (Text)
    - Password (Text)

Output Parameters:
  - Response (LoginResponse structure)

Logic:
1. Validate input (check Email and Password are not empty)
2. Query database to find user by Email
3. Verify password (compare hashed passwords)
4. If valid:
   - Generate authentication token (JWT or session token)
   - Set Response.Success = True
   - Set Response.Message = "Login successful"
   - Set Response.Token = [generated token]
   - Set Response.User.UserId = [user id from database]
   - Set Response.User.Name = [user name]
   - Set Response.User.Email = [user email]
   - Set Response.User.PhoneNumber = [user phone]
5. If invalid:
   - Set Response.Success = False
   - Set Response.Message = "Invalid email or password"
   - Set Response.Token = ""
   - Set Response.User = Null
6. Return Response
```

### Step 4: Key Points for Login Action

```
┌─────────────────────────────────────┐
│ REST Method: POST /Login           │
├─────────────────────────────────────┤
│ Request Body Parameter:             │
│   Name: RequestData                 │
│   Type: LoginRequest (Structure)    │
│   - Email (Text)                    │
│   - Password (Text)                 │
├─────────────────────────────────────┤
│ Response:                           │
│   Format: JSON                      │
│   Output Parameter: Response        │
│   Type: LoginResponse (Structure)   │
│   - Success (Boolean)               │
│   - Message (Text)                  │
│   - Token (Text)                    │
│   - User (UserDetails Structure)    │
└─────────────────────────────────────┘
```

### Step 5: Repeat for Register Method

Apply the same pattern for the **Register** method:

**Create `RegisterResponse` structure:**
```
RegisterResponse (Structure)
├── Success (Boolean)
├── Message (Text)
├── Token (Text)
└── User (UserDetails Structure)
```

**Register Server Action Logic:**
```
1. Validate input (Name, Email, PhoneNumber, Password)
2. Check if email already exists
3. If exists:
   - Return Success = False, Message = "Email already registered"
4. If not exists:
   - Hash the password
   - Create new user in database
   - Generate authentication token
   - Return Success = True with User data and Token
```

### Step 6: Configure GetUser Method

```
┌─────────────────────────────────────┐
│ REST Method: GET /GetUser           │
├─────────────────────────────────────┤
│ Query Parameter:                    │
│   Name: UserId                      │
│   Type: Text                        │
├─────────────────────────────────────┤
│ Response:                           │
│   Format: JSON                      │
│   Output Parameter: Response        │
│   Type: GetUserResponse (Structure) │
│   - Success (Boolean)               │
│   - Message (Text)                  │
│   - User (UserDetails Structure)    │
└─────────────────────────────────────┘
```

## Example OutSystems Logic Implementation

### Login Server Action (Pseudo-code)

```sql
-- Step 1: Get user from database
SELECT User.Id, User.Name, User.Email, User.PasswordHash, User.PhoneNumber
FROM User
WHERE User.Email = RequestData.Email

-- Step 2: Check if user exists and password matches
IF User found AND VerifyPassword(RequestData.Password, User.PasswordHash) THEN
    -- Step 3: Generate token (you can use JWT or Session Token)
    Token = GenerateAuthToken(User.Id)

    -- Step 4: Build success response
    Response.Success = True
    Response.Message = "Login successful"
    Response.Token = Token
    Response.User.UserId = User.Id
    Response.User.Name = User.Name
    Response.User.Email = User.Email
    Response.User.PhoneNumber = User.PhoneNumber
ELSE
    -- Step 5: Build error response
    Response.Success = False
    Response.Message = "Invalid email or password"
    Response.Token = ""
END IF

-- Step 6: Return the response (OutSystems will serialize to JSON)
```

## Important OutSystems Settings

### 1. Enable CORS

For your frontend to call the API, enable CORS:

1. In your REST API properties
2. Under **Advanced** settings
3. Enable **CORS (Cross-Origin Resource Sharing)**
4. Add allowed origins:
   - `http://localhost:3000` (for development)
   - Your production domain

### 2. Set Response Content-Type

Ensure the REST method has:
- **Response Format**: `JSON`
- **Response Content Type**: `application/json`

### 3. HTTP Status Codes

Set appropriate status codes:
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Authentication error: `401 Unauthorized`
- Server error: `500 Internal Server Error`

## Testing Your Fixed API

### Using OutSystems Service Center

1. Go to **Service Center**
2. Navigate to **Monitoring** → **Web References**
3. Test your REST API endpoint manually

### Using curl

```bash
# Test Login
curl -X POST \
  "https://personal-fxfq0mme.outsystemscloud.com/UserAuth_API/rest/UserAuthAPI/Login" \
  -H "Content-Type: application/json" \
  -d '{
    "RequestData": {
      "Email": "test@example.com",
      "Password": "password123"
    }
  }'

# Expected Response:
{
  "Success": true,
  "Message": "Login successful",
  "Token": "eyJhbGciOiJIUzI1...",
  "User": {
    "UserId": "123",
    "Name": "Test User",
    "Email": "test@example.com",
    "PhoneNumber": "+1234567890"
  }
}
```

## Common OutSystems Mistakes to Avoid

### ❌ Mistake 1: Not Setting Output Parameter
```
REST Method → Response → (No output parameter defined)
Result: Empty response
```

### ✅ Solution:
```
REST Method → Response → Output Parameter: Response (LoginResponse)
```

### ❌ Mistake 2: Not Returning the Structure
```
Server Action doesn't assign values to output parameter
Result: Empty or null response
```

### ✅ Solution:
```
Explicitly set all fields of the Response structure before returning
```

### ❌ Mistake 3: Wrong Response Format
```
REST Method → Response Format: Text
Result: Not JSON
```

### ✅ Solution:
```
REST Method → Response Format: JSON
```

## Debugging in OutSystems

### Enable Detailed Logging

1. In your Server Action, add **Log Message** nodes:
```
Log: "Login attempt for email: " + RequestData.Email
Log: "User found: " + (User.Id <> NullIdentifier())
Log: "Sending response: " + Response.Success
```

2. Check logs in **Service Center** → **Monitoring** → **Errors**

### Test the Action Directly

1. Right-click on your **Login** Server Action
2. Select **Test**
3. Provide test input parameters
4. Verify the output structure is populated correctly

## Checklist

Before testing again, verify:

- [ ] Response structure is defined (LoginResponse, RegisterResponse, GetUserResponse)
- [ ] REST method has Output Parameter set to the response structure
- [ ] Response Format is set to `JSON`
- [ ] Response Content-Type is `application/json`
- [ ] Server Action populates ALL fields in the response structure
- [ ] Server Action returns the response structure
- [ ] CORS is enabled for your frontend domain
- [ ] Server Action logic handles both success and error cases
- [ ] All response messages are user-friendly

## After Fixing

Once you've made these changes in OutSystems:

1. **Publish your module** in Service Studio
2. **Test with curl** to verify JSON response
3. **Try logging in** from your frontend
4. You should see in console:
```
[API Response Text] {"Success":true,"Message":"Login successful",...}
```

## Need More Help?

If you're still having issues:

1. Share the OutSystems Server Action logic screenshot
2. Share the REST method configuration screenshot
3. Check OutSystems error logs in Service Center
4. Verify the database has user records with correct email/password

The key issue is: **Your OutSystems REST API must return a JSON response body**. Currently, it's returning nothing.
