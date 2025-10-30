# Cloud Firestore Security Rules — Official Examples (Exact Copy)

> Source: Get started with Cloud Firestore Security Rules
> https://firebase.google.com/docs/firestore/security/get-started

## Locked rules (deny all)

```c
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Allow read/write for authenticated users only

```c
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Match a specific collection and restrict writes

```c
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cities/{city} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.data.size() < 1024;
    }
  }
}
```
