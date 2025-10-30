# Cloud Firestore Web v9 (Modular) — Official Examples (Exact Copy)

> Source: Get started with Cloud Firestore — Web (firebase@12.4.0)
> https://firebase.google.com/docs/firestore/quickstart

## Install

```bash
npm install firebase@12.4.0 --save
```

## Initialize (Web modular)

```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  FIREBASE_CONFIGURATION,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app)
```

## Add a document

> Source: Quickstart — Add data
> https://firebase.google.com/docs/firestore/quickstart

```js
import { collection, addDoc } from 'firebase/firestore'

try {
  const docRef = await addDoc(collection(db, 'users'), {
    first: 'Ada',
    last: 'Lovelace',
    born: 1815,
  })
  console.log('Document written with ID: ', docRef.id)
} catch (e) {
  console.error('Error adding document: ', e)
}
```

## Get a document

> Source: Get data with Cloud Firestore — Web
> https://firebase.google.com/docs/firestore/query-data/get-data

```js
import { doc, getDoc } from 'firebase/firestore'

const docRef = doc(db, 'cities', 'SF')
const docSnap = await getDoc(docRef)

if (docSnap.exists()) {
  console.log('Document data:', docSnap.data())
} else {
  // docSnap.data() will be undefined in this case
  console.log('No such document!')
}
```

## Query and get documents

> Source: Upgrade to modular API — Web
> https://firebase.google.com/docs/web/modular-upgrade

```js
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'

const db = getFirestore(firebaseApp)
const q = query(collection(db, 'cities'), where('capital', '==', true))
const querySnapshot = await getDocs(q)
querySnapshot.forEach((doc) => {
  // doc.data() is never undefined for query doc snapshots
  console.log(doc.id, ' => ', doc.data())
})
```

## Listen for realtime updates (document)

> Source: Get realtime updates — Web
> https://firebase.google.com/docs/firestore/query-data/listen

```js
import { doc, onSnapshot } from 'firebase/firestore'

const unsub = onSnapshot(doc(db, 'cities', 'SF'), (doc) => {
  console.log('Current data: ', doc.data())
})
```
