# Sequence Diagram
This diagram shows how and in wich order the diferents components of the system interacts between them when a new piece of art is uploaded through the admin panel.


```mermaid
   sequenceDiagram
    autonumber
    participant Client as Frontend (Vanilla JS)
    participant Auth as Firebase Auth
    participant Go as Backend (Go)
    participant CDN as Cloudinary
    participant DB as Firestore

    Client->>Auth: Request Login (Credentials)
    Auth-->>Client: Return JWT Token
    
    Note over Client,Go: Artwork Upload Process
    Client->>Go: POST /upload (JWT + File + Metadata)
    
    Go->>Auth: Validate JWT signature
    
    alt Token is Invalid or Expired
        Auth-->>Go: Validation Failed
        Go-->>Client: 401 Unauthorized (Error Message)
    else Token is Valid
        Auth-->>Go: Validation Success
        
        Go->>CDN: Upload physical file (Binary)
        CDN-->>Go: Return optimized Image URL
        
        Go->>DB: Save new document (URL + Metadata)
        DB-->>Go: Acknowledge successful save
        
        Go-->>Client: 200 OK (Upload Complete)
    end
```

- **Authentication:** Validating the client's JWT via Firebase Auth.
- **Error Handling:** Fallback logic returning a `401 Unauthorized` if the token is invalid or expired.
- **Media Processing:** Uploading the physical binary file to Cloudinary to get an optimized URL.
- **Data Persistence:** Saving the final document (Metadata + Image URL) into Firestore.