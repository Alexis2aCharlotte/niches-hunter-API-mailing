# Niches Hunter API Mailing ⚡

Mailing hebdomadaire d'engagement pour les développeurs API de Niches Hunter.

## 🏗️ Architecture

- **Récupère 1 niche tendance** (meilleur score des 7 derniers jours)
- **Génère du contenu IA** (highlight niche + API tip + message engagement)
- **Personnalise par dev** (solde, stats d'usage, dernier appel)
- **Envoie aux devs actifs** (table `api_developers`, non opt-out)
- **Gère le désabonnement** (page HTML + update DB)
- **Notification Telegram** après chaque envoi

## 📊 Tables Supabase utilisées

### Table `api_developers` (destinataires)
```sql
SELECT * FROM api_developers WHERE is_active = true AND newsletter_opted_out = false;
```

### Table `api_wallets` (solde par dev)
```sql
SELECT * FROM api_wallets WHERE user_id IN (...);
```

### Table `api_calls` (stats d'usage — batch)
```sql
SELECT user_id, created_at FROM api_calls WHERE user_id IN (...) AND created_at >= first_of_month;
```

### Table `niches` (contenu — meilleur score 7 jours)
```sql
SELECT * FROM niches WHERE created_at >= now() - interval '7 days' ORDER BY score DESC LIMIT 1;
```

## 🔧 Variables d'environnement

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
OPENAI_API_KEY=sk-xxx
RESEND_API_KEY=xxx
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
SITE_URL=https://nicheshunter.app
SERVICE_URL=https://your-railway-url.up.railway.app
PORT=3003
```

## 🚀 Déploiement Railway

1. Connecter le repo GitHub
2. Ajouter les variables d'environnement (voir `.env.example`)
3. Configurer un CRON job : `0 10 * * 2` (mardi 10h00) → `POST /generate`
4. Récupérer l'URL publique Railway et la mettre dans `SERVICE_URL`

## 📝 Développement local

```bash
npm install
npm run dev       # Serveur Express en mode watch
npm run preview   # Génère le HTML sans envoyer (2 versions: normal + low balance)
npm start         # Lance la génération complète
```

## 📡 Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Health check |
| POST | `/generate` | Déclenche la génération + envoi |
| GET | `/api-unsubscribe?email=xxx` | Désabonnement (page HTML) |
| GET | `/api-resubscribe?email=xxx` | Ré-abonnement (page HTML) |
| POST | `/api-unsubscribe` | Désabonnement programmatique (JSON) |

## 🔄 Workflow

```
1. CRON trigger (mardi 10h00)
       ↓
2. POST /generate
       ↓
3. Récupère 1 niche tendance (meilleur score, 7 derniers jours)
       ↓
4. Génère contenu IA (niche highlight + API tip + engagement msg)
       ↓
5. Récupère les devs actifs (non opt-out) — 1 query
       ↓
6. Batch fetch wallets + stats — 3 queries en parallèle
       ↓
7. Génère HTML personnalisé + envoie via Resend (600ms delay)
       ↓
8. Notification Telegram récap
```

## 📧 Contenu du mail

| Section | Description |
|---------|-------------|
| **Header** | Greeting personnalisé + message d'engagement |
| **Dashboard** | Solde, appels ce mois, dernier appel |
| **Niche of the Week** | Niche tendance avec score + highlight + CTA |
| **API Tip** | Conseil pratique d'utilisation de l'API |
| **Low Balance Alert** | Affiché uniquement si solde < €5 |
| **Footer** | Lien de désabonnement |

## 🔕 Désabonnement

- Chaque mail contient un lien `GET /api-unsubscribe?email=xxx`
- Le dev voit une page de confirmation dark theme
- La page propose un lien pour se ré-abonner
- Met à jour `api_developers.newsletter_opted_out = true`
- Le compte API et les crédits restent actifs

## 🔄 Performance

- **3 queries Supabase** pour récupérer tous les devs + wallets + stats (au lieu de 2N+1)
- Wallets et stats fetchés en **parallèle** (`Promise.all`)
- Envoi emails séquentiel avec 600ms delay (rate limit Resend)
