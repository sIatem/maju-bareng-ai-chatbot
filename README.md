# Yang akan kita kerjakan...

1. Sedia static directory
2. Implementasi endpoint chatbot (POST /api/chat)
   - Mulai bikin endpoint baru POST /api/chat
   - Kita buat handler untuk meng-handle request POST /api/chat yang dari browser
   - Buat beberapa "satpam" (guard clause):
     1. Handle payload `conversation` dari `req.body` apakah conversation-nya berupa Array atau tidak
     2. Handle setiap message yang ada pada payload `conversation`, untuk cek apakah setiap message-nya sudah berupa `object` dengan isinya `{ role: 'user' | 'model', message: string }`. Tandai sebagai invalid jika:
        - Ada elemen yang tidak sesuai (tipe data-nya lain dari `object` atau nilainya `null`)
        - Setiap elemen tidak memiliki 2 property persis, dan tidak memiliki `role` dan `model` pada object-nya
        - `role` tidak berupa `user` atau `model`, atau `message` tidak bertipe data `string` atau berisi string kosong (`""` atau `''`)
   - Lakukan mapping agar bisa dikirim ke Google Gemini API dengan function/method `generateContent()`
   - Message yang diterima oleh Google Gemini API nanti akan dikirimkan kembali ke user dengan format `{ success: boolean, message: string, data: string }`
