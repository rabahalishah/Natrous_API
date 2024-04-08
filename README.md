Title: NatoursAPI: Tour Booking Backend RESTful API

Overview:
NatoursAPI is a robust backend RESTful API developed specifically for facilitating seamless tour bookings. Leveraging Node.js, Express.js, and MongoDB, this project offers a comprehensive solution for managing tours, user authentication, role-based access controls, user feedback, and secure payment transactions. With features such as CRUD operations on users and reviews, monthly plans, distance calculations between locations, and sorting tours based on the shortest distance and affordability, NatoursAPI sets a new standard for tour booking APIs.

Key Features:
1. RESTful API Development:
   - NatoursAPI is built as a RESTful API using Node.js and Express.js, ensuring efficient and scalable communication between clients and the server.
   - RESTful architecture promotes standardization, flexibility, and ease of integration with frontend applications.

2. MongoDB Data Modeling:
   - The project employs MongoDB as its database solution, designed and modeled to handle diverse user needs effectively.
   - NoSQL database modeling enables seamless data storage, retrieval, and manipulation, accommodating varying data structures and requirements.

3. Secure User Authentication:
   - NatoursAPI implements secure user authentication mechanisms to safeguard user accounts and sensitive information.
   - Role-based access controls ensure that users have appropriate permissions based on their roles within the system.

4. Tour Booking and Feedback:
   - Users can register, book tours, and provide feedback on their experiences, enhancing user engagement and satisfaction.
   - CRUD operations are available for managing users and their reviews, facilitating efficient data management and analysis.

5. Secure Payment Integration:
   - The API integrates secure payment methods to facilitate reliable transactions between users and tour providers.
   - Secure payment processing enhances trust and reliability, ensuring seamless financial transactions.

6. Distance Calculation and Sorting:
   - NatoursAPI calculates distances between tour locations, providing valuable information for itinerary planning and logistics.
   - Tours can be sorted based on the shortest distance, optimizing travel routes and enhancing user experience.

7. Affordable Tour Options:
   - A dedicated API endpoint offers access to cheap tour options, enabling users to discover budget-friendly travel opportunities.
   - Affordable tour options cater to diverse user preferences and budgetary constraints, expanding the accessibility of travel experiences.

Users Review:
"NatoursAPI has revolutionized the way we handle tour bookings. With its intuitive interface, secure authentication, and comprehensive features, managing tours and user feedback has never been easier. The integration of secure payment methods adds an extra layer of trust, ensuring seamless transactions for both users and providers. The ability to calculate distances between locations and sort tours based on the shortest distance has significantly optimized our itinerary planning process. Additionally, the availability of affordable tour options caters to a broader audience, making travel experiences accessible to all. NatoursAPI is truly a game-changer in the tour booking industry." - Satisfied User

# APIs
## Authentication
Sign up: 
```bash
{{URL}}api/v1/users/signup
```
```bash
{
    "name":"temp",
    "email":"temp@gmail.com",
    "password":"test1234",
    "passwordConfirm":"test1234",
    "role":"user"   
}
```
forgot password: 
```bash
{{URL}}api/v1/users/forgotPassword
```
```bash
{
    "email": "user@gmail.com"
}
```
Reset password: 
```bash
{{URL}}api/v1/users/resetPassword/4c64adce368b89bc00b8cc874bcece2debee97f3ffab5a5b683beb824dd8eafa
```
```
{
    "password":"test1234",
    "passwordConfirm":"test1234"
}
```
Login In: 
```bash
{{URL}}api/v1/users/login
```
```bash
{
    "email":"john@example.com",
    "password": "{{password}}"
}
```
Update current user password: 
```bash
{{URL}}api/v1/users/updateMyPassword
```
```bash
{
    "passwordCurrent":"test1234",
    "password":"admin1234",
    "passwordConfirm":"admin1234"
}
```

## Tour Route
Get all tours: 
```bash
{{URL}}api/v1/tours
```
Get tours: 
```bash
{{URL}}api/v1/tours/6554aec4dd432b3d20b790a5
```
Create new tour: 
```bash
{{URL}}api/v1/tours
```
```bash
{
    "name": "The new Test Tour",
    "duration": 1,
    "maxGroupSize": 1,
    "difficulty": "difficult",
    "price": 1,
    "summary": "Test tour",
    "imageCover": "tour-3-cover.jpg"
  
  }
 ``` 
update Tour: 
```bash
{{URL}}65260e0bf5d663255c85c266
```
Delete tour:
```bash
{{URL}}api/v1/tours/5c88fa8cf4afda39709c295a
```
GET top 5 cheap tours: 
```bash
{{URL}}api/v1/tours/top-5-cheap
```
GET monthly plan:
```bash
{{URL}}api/v1/tours/monthly-plan/2021
```
GET tour Stats:
```bash
{{URL}}api/v1/tours/tour-stats
```
Get tour within radius:
```bash
{{URL}}api/v1/tours/tours-within/200/center/34.111745,-118.113491/unit/mi
```
GET distance to tours from point:
```bash
{{URL}}api/v1/tours/distances/34.111745,-118.113491/unit/mi
```

## Users Routes
GET all users: 
```bash
{{URL}}api/v1/users
```
GET users: 
```bash
{{URL}}api/v1/users/1
```
UPDATE user: 
```bash
{{URL}}api/v1/users/1
```
DELETE user: 
```bash
{{URL}}api/v1/users/1
```
CREATE user: 
```bash
{{URL}}api/v1/users
```
UPDATE current user data: 
```bash
{{URL}}api/v1/users/updateMe
```
DELETE current user: 
```bash
{{URL}}api/v1/users/deleteMe
```
Get Current user: 
```bash
{{URL}}api/v1/users/me
```

## Tours/Routes routes
Create a new review: 
```bash
{{URL}}api/v1/tours/5c8a24822f8fb814b56fa192/reviews
```
```bash
{
    "rating":4,
    "review":"sample 4"
}
```
Get all reviews on a tour: 
```bash
{{URL}}api/v1/tours/5c88fa8cf4afda39709c295d/reviews
```


## Reviews
Update Reviews: 
```bash
{{URL}}api/v1/reviews/65590cefd21f7511ec10af0a
```
```bash
{
    "rating": 1
}
```
Delete Reviews: 
```bash
{{URL}}api/v1/reviews/65590cefd21f7511ec10af0a
```
```bash

```
Get Reviews: 
```bash
{{URL}}api/v1/reviews/6559008afe29a20dacecdac0
```
Create Reviews: 
```bash
{{URL}}api/v1/reviews/
```
```bash
{
    "review":"loved it!",
    "rating":"5",
    "tour":"5c88fa8cf4afda39709c2955",
    "user":"65446749ac36f14710cf8db8"
}
```
Get All reviews: 
```bash
{{URL}}api/v1/reviews
```

