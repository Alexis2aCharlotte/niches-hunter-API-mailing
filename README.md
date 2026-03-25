# Niches Hunter API Mailing ⚡

Mailing hebdomadaire d'engagement pour les développeurs API de Niches Hunter.

## 🏗️ Architecture

- **Récupère 1 niche tendance** depuis la table `niches`
- **Génère du contenu IA** (highlight niche + API tip + message engagement)
- **Personnalise par dev** (solde, stats d'usage, dernier appel)
- **Envoie aux devs actifs** (table `api_developers`, non opt-out)
- **Notification Telegram** après chaque envoi

## 📊 Tables Supabase utilisées

### Table `api_developers` (destinataires)
```sql
SELECT * FROM api_developers WHERE is_active = true AND newsletter_opted_out = false;
```

### Table `api_wallets` (solde par dev)
```sql
SELECT balance_cents FROM api_wallets WHERE user_id = ?;
```

### Table `api_calls` (stats d'usage)
```sql
SELECT COUNT(*) FROM api_calls WHERE user_id = ? AND created_at >= first_of_month;
```

### Table `niches` (contenu)
```sql
SELECT * FROM niches ORDER BY created_at DESC LIMIT 1;
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
PORT=3003
```

## 🚀 Déploiement

### Railway
1. Connecter le repo GitHub
2. Ajouter les variables d'environnement
3. Configurer un CRON job : `0 10 * * 2` (mardi 10h00) → `POST /generate`

## 📝 Développement local

```bash
npm install
npm run dev       # Serveur Express en mode watch
npm run preview   # Génère le HTML sans envoyer
npm start         # Lance la génération complète
```

## 📡 Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Health check |
| POST | `/generate` | Déclenche la génération + envoi |

## 🔄 Workflow

```
1. CRON trigger (mardi 10h00)
       ↓
2. POST /generate
       ↓
3. Récupère 1 niche tendance
       ↓
4. Génère contenu IA (niche highlight + API tip + engagement msg)
       ↓
5. Récupère les devs actifs (non opt-out)
       ↓
6. Pour chaque dev : fetch wallet + stats
       ↓
7. Génère HTML personnalisé + envoie via Resend
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

- Lien dans chaque mail : `nicheshunter.app/api-unsubscribe?email=xxx`
- Met à jour `api_developers.newsletter_opted_out = true`
- Le compte API reste actif
