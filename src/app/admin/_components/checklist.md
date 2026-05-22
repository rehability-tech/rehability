# 📋 Plan: Całkowity redesign Topbara + Powiadomienia i Ustawienia

**Cel:** Zmiana stylistyki Topbara na bardziej nowoczesny (np. czystszy SaaS-owy styl), podpięcie dzwoneczka pod realny system powiadomień z bazy danych oraz stworzenie widoku ustawień konta/aplikacji.

## 🗄️ 1. Baza Danych (Prisma)

- [ ] **Model Powiadomień:** Dodać model `Notification` do `schema.prisma`.
  ```prisma
  model Notification {
    id        String   @id @default(cuid())
    userId    String   // Do kogo trafia powiadomienie (np. ID Admina)
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    title     String
    message   String?  @db.Text
    type      String   @default("INFO") // INFO, SUCCESS, WARNING, BOOKING, itp.
    isRead    Boolean  @default(false)
    link      String?  // Opcjonalny URL do przekierowania po kliknięciu
    createdAt DateTime @default(now())
  }
  ```
