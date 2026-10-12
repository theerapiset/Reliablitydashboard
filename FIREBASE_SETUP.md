# ตั้งค่า Firebase แบบ step-by-step (สำหรับคนไม่เคยใช้มาก่อน)

เป้าหมาย: ทำให้แอปเก็บข้อมูลไว้ที่ Firebase (ฟรี) แทนเครื่องใครเครื่องมัน
เพื่อให้คุณกับหัวหน้าเห็นข้อมูลชุดเดียวกัน โดย**คุณคนเดียวแก้ไขข้อมูลได้**
(ต้องใส่รหัส Admin) ส่วนใครก็ตามที่มีลิงก์จะเห็นข้อมูลได้อย่างเดียว แก้ไม่ได้

ใช้เวลาทำครั้งแรกประมาณ 25-35 นาที ทำครั้งเดียวจบ ไม่ต้องทำซ้ำอีก

หมายเหตุ: Firebase อัปเดต UI ใหม่ เมนูซ้ายมืออาจเป็นหมวดหมู่ เช่น
**"Databases & Storage"**, **"Security"** แทนคำว่า "Build" แบบเดิม — ถ้าเมนูที่คุณเห็นไม่ตรงกับที่บอกในนี้เป๊ะๆ บอกผมได้ ผมช่วยปรับให้ตรงกับที่คุณเห็นจริง

---

## สิ่งที่ต้องมีก่อนเริ่ม
- บัญชี Google (Gmail อะไรก็ได้ที่คุณมีอยู่แล้ว ใช้ได้เลย)
- โปรเจกต์นี้อยู่ในเครื่องคุณแล้ว (โฟลเดอร์ `app/`) พร้อม Node.js ติดตั้งไว้
- คิดรหัสผ่าน Admin ไว้ 1 ชุด (จะใช้ปลดล็อกโหมดแก้ไขในแอป — อย่าใช้รหัสผ่านที่ใช้ซ้ำที่อื่น)

---

## ขั้นที่ 1 — สร้างโปรเจกต์ Firebase ✅ (ทำแล้ว)

---

## ขั้นที่ 2 — เปิดใช้งาน Firestore (ที่เก็บข้อมูล)

1. เมนูซ้ายมือ คลิก **"Databases & Storage"** ให้ขยายออก (หรือ "Build" ถ้าเป็น UI เก่า)
2. คลิก **"Firestore Database"**
3. กด **"Create database"**
4. เลือก location — `asia-southeast1 (Singapore)` → Next
5. เลือก **"Start in production mode"** → Create/Enable
6. รอจนเข้าหน้า Firestore ว่างๆ → เสร็จขั้นที่ 2

---

## ขั้นที่ 3 — เปิดใช้งาน Storage (ที่เก็บรูปภาพ)

1. เมนูเดิม **"Databases & Storage"** → คลิก **"Storage"**
2. กด **"Get started"** → Next (ค่า default โอเค เดี๋ยวแก้ทีหลัง) → เลือก location เดียวกับ Firestore → Done → เสร็จขั้นที่ 3

---

## ขั้นที่ 4 — เปิด Authentication + สร้างบัญชี Admin (สำหรับรหัสแก้ไข)

นี่คือขั้นที่ทำให้ **"มีแค่คุณคนเดียวแก้ไขได้"** ตามที่ต้องการ — สร้างบัญชี "แอดมิน" ไว้ 1 บัญชี รหัสผ่านของบัญชีนี้ = รหัสที่คุณจะพิมพ์ในแอปเพื่อปลดล็อก

1. เมนูซ้าย มองหา **"Build"** หรือหมวดที่มีคำว่า **"Authentication"** → คลิกเข้าไป
2. กด **"Get started"**
3. ในรายการ Sign-in providers เลือก **"Email/Password"** → เปิดสวิตช์ **Enable** → Save
4. ไปแท็บ **"Users"** ด้านบน → กด **"Add user"**
5. ใส่:
   - Email: พิมพ์เป๊ะๆ ว่า `admin@kpi.local` (ค่านี้ตายตัว ต้องตรงนี้เท่านั้น ห้ามเปลี่ยน)
   - Password: **รหัสผ่านที่คุณคิดไว้** (นี่คือรหัส Admin ที่จะพิมพ์ในแอป จำให้ดี)
6. กด **Add user** → เสร็จขั้นที่ 4

---

## ขั้นที่ 5 — ลงทะเบียนแอปเว็บ เอา "กุญแจ" มาใช้

1. กดไอคอนเฟือง ⚙️ (มุมซ้ายบน ข้าง Project Overview) → **"Project settings"**
2. เลื่อนลงส่วน **"Your apps"** → กดไอคอน **`</>`** (เว็บ)
3. ตั้งชื่อเล่นแอป เช่น `kpi-dashboard-web` → **"Register app"**
4. หน้าจอโชว์โค้ดแบบนี้ (ค่าจริงจะไม่เหมือนตัวอย่าง):
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxx",
     authDomain: "gcm-pta-kpi.firebaseapp.com",
     projectId: "gcm-pta-kpi",
     storageBucket: "gcm-pta-kpi.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```
5. **คัดลอกค่าทั้ง 6 ตัวเก็บไว้** → Continue to console

---

## ขั้นที่ 6 — เอากุญแจใส่โปรเจกต์ของคุณ

1. เปิดโฟลเดอร์ `app/` ในเครื่องคุณ
2. คัดลอกไฟล์ **`.env.example`** → ตั้งชื่อไฟล์ใหม่ว่า **`.env`** (โฟลเดอร์เดียวกัน)
3. เปิดไฟล์ `.env` ด้วย Notepad/VS Code แล้วนำค่าจากขั้นที่ 5 มาใส่:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyD-xxxxxxxxxxxxxxxxxxxxx
   VITE_FIREBASE_AUTH_DOMAIN=gcm-pta-kpi.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=gcm-pta-kpi
   VITE_FIREBASE_STORAGE_BUCKET=gcm-pta-kpi.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
   ```
4. บันทึกไฟล์ → เสร็จขั้นที่ 6

---

## ขั้นที่ 7 — ตั้ง Security Rules (อ่านได้ทุกคน แก้ได้เฉพาะ Admin)

**Firestore** (Firestore Database → แท็บ "Rules"):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stores/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
กด **Publish**

**Storage** (Storage → แท็บ "Rules"):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
กด **Publish** → เสร็จขั้นที่ 7

`request.auth != null` แปลว่า "ต้องล็อกอินอยู่" — และมีแค่บัญชี `admin@kpi.local` ที่คุณสร้างไว้ในขั้นที่ 4 เท่านั้นที่ล็อกอินได้ (ไม่มีหน้าสมัครสมาชิกในแอป) จึงมีแค่คนที่รู้รหัสนี้เท่านั้นที่แก้ไขได้จริง — บังคับที่ระดับเซิร์ฟเวอร์ ไม่ใช่แค่ซ่อนปุ่มในหน้าเว็บ

---

## ขั้นที่ 8 — ทดสอบในเครื่องตัวเองก่อน

```bash
cd app
npm install
npm run dev
```
เปิดเบราว์เซอร์ไปที่ลิงก์ที่ขึ้น (ปกติ `http://localhost:5173`)

- มุมขวาบนควรขึ้น **"● Saved · shared"** สีเขียว = เชื่อมต่อ Firebase สำเร็จ
- ข้าง badge จะมีปุ่ม **"🔒 View only"** → กด → ใส่รหัส Admin ที่ตั้งไว้ในขั้นที่ 4 → ควรเปลี่ยนเป็น **"🔓 Admin mode"** และปุ่ม Add/Edit/Delete ทั้งหมดกดได้
- ลอง**เปิดแท็บ Incognito** (ไม่ล็อกอิน) แล้วเข้าลิงก์เดียวกัน → ควรเห็นข้อมูลเหมือนกันแต่กดแก้ไขอะไรไม่ได้เลย (ปุ่มจางๆ กดไม่ติด) — ถ้าเป็นแบบนี้แปลว่าถูกต้องแล้ว

ถ้าเชื่อมต่อไม่ติด (badge สีแดง/เหลือง) เช็ค:
- ไฟล์ชื่อ `.env` ถูกต้อง (ไม่ใช่ `.env.txt`) อยู่ใน `app/`
- ค่าที่ paste ไม่มีช่องว่าง/เครื่องหมายคำพูดเกิน
- ทำขั้นที่ 7 (Rules) ครบทั้ง 2 ที่แล้ว

ถ้าใส่รหัส Admin แล้วไม่ผ่าน เช็ค:
- Email ในขั้นที่ 4 พิมพ์ตรงตัวว่า `admin@kpi.local` หรือไม่
- Email/Password provider เปิด Enable แล้วหรือยัง (ขั้นที่ 4 ข้อ 3)

---

## ขั้นที่ 9 — เผยแพร่ให้หัวหน้าเข้าถึงได้ (Deploy)

แนะนำ **Firebase Hosting** เพราะอยู่ในระบบเดียวกับที่ตั้งไว้แล้ว:

```bash
npm install -g firebase-tools     # ครั้งเดียว
firebase login                    # ล็อกอินด้วย Google account เดียวกับข้อ 1
cd app
npm run build
firebase init hosting              # เลือกโปรเจกต์ที่สร้างไว้, public directory = dist, single-page app = Yes
firebase deploy --only hosting
```
ได้ลิงก์แบบ `https://gcm-pta-kpi.web.app` — **ส่งลิงก์นี้ให้หัวหน้าได้เลย** หัวหน้าเปิดดูได้ทุกอย่าง แต่แก้ไขไม่ได้จนกว่าจะรู้รหัส Admin (ซึ่งมีแค่คุณที่รู้)

---

## ขั้นที่ 10 (ทำภายหลังก็ได้) — CORS สำหรับปุ่ม Export PPTX

ปุ่ม "⤓ PPTX" ต้องดึงรูปที่อัปโหลดไว้มาฝังในไฟล์ PowerPoint (ส่วนอื่นของแอปใช้ได้ปกติโดยไม่ต้องทำขั้นนี้):
```bash
cat > cors.json << 'EOF'
[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]
EOF
gsutil cors set cors.json gs://<your-project-id>.appspot.com
```

---

## สรุปสั้นๆ ถ้าจำไม่ได้ว่าทำถึงไหน
1. ✅ สร้างโปรเจกต์
2. เปิด Firestore Database
3. เปิด Storage
4. เปิด Authentication → Email/Password → สร้าง user `admin@kpi.local` + รหัสผ่านของคุณ
5. ลงทะเบียนเว็บแอป เอา config 6 บรรทัด
6. ใส่ค่าใน `app/.env`
7. Paste security rules (read: if true, write: if request.auth != null) ทั้ง Firestore และ Storage
8. `npm run dev` → ทดสอบ badge เขียว + ปลดล็อก Admin + เช็คโหมด incognito ว่าแก้ไม่ได้
9. `firebase deploy` → ส่งลิงก์ให้หัวหน้า

ติดตรงไหนบอกผมได้เลยครับ ส่ง screenshot มาก็ได้
