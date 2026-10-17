# Allô Dabou Chauffeur 🚖🛵

Application Progressive Web App (PWA) mobile-first pour les chauffeurs VTC, taxis et coursiers à Dabou (Côte d'Ivoire).

## Variables d'environnement

Les variables suivantes sont configurées dans `.env` :

| Variable | Description | Requis |
| :--- | :--- | :--- |
| `VITE_FIREBASE_VAPID_KEY` | Clé publique Web Push VAPID pour Firebase Cloud Messaging (notifications d'arrière-plan). | Optionnel |
| `GEMINI_API_KEY` | Clé d'API Google Gemini (injectée automatiquement par AI Studio si besoin). | Non |
| `APP_URL` | URL publique de l'application Cloud Run. | Automatique |

La configuration du projet Firebase (`firebase-applet-config.json`) est automatiquement synchronisée avec la même base Firestore et Firebase Auth que l'application cliente « Allô Dabou VTC ».

## Architecture & Collections partagées

### Collection `users`
- `displayName`: Nom complet du chauffeur
- `phone`: Numéro de téléphone (format CI : +225 01/05/07...)
- `role`: `'client' | 'driver_pending' | 'driver' | 'admin'`
- `isApprovedDriver`: Booléen d'approbation administrative
- `approved`: Alias d'approbation
- `vehicleType`: `'moto' | 'voiture'`
- `vehicleNumber`: Numéro de plaque d'immatriculation
- `isOnline`: État en ligne / hors ligne
- `lastSeenAt`: Horodatage du dernier signal (heartbeat 60s)
- `fcmTokens`: Jetons push Web FCM
- `ratingAverage`: Note moyenne (sur 5)
- `ratingCount`: Nombre total d'avis reçus
- `totalRatingSum`: Somme cumulée des notes

### Collection `rides`
- `userId`, `userName`, `userPhone`, `userEmail`
- `pickupAddress`, `pickupLat`, `pickupLng`
- `destinationAddress`, `destinationLat`, `destinationLng`
- `distanceKm`, `durationMin`, `priceFcfa`
- `serviceType`: `'vtc' | 'taxi' | 'delivery' | 'concierge'`
- `vehicleTypeRequested`: `'moto' | 'voiture' | 'any'`
- `status`: `'pending' | 'confirmed' | 'driver_arriving' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled'`
- `driverId`, `driverName`, `driverPhone`, `driverVehiclePlate`, `driverVehicleType`
- `acceptedAt`, `arrivingAt`, `arrivedAt`, `startedAt`, `completedAt`
- `cancelledBy`, `cancelReason`
- `paymentStatus`: `'unpaid' | 'paid'`
- `paymentMethod`: `'cash'`
- `declinedBy`: Tableau des UIDs ayant décliné ou ignoré la course
- `rating`, `ratingComment`, `ratedAt`

## Notifications Push Firebase Cloud Messaging (FCM)

L'application intègre une architecture complète de notifications push pour alerter les chauffeurs à Dabou dès qu'un client soumet une course :

1. **Enregistrement des jetons Chauffeur** :
   - Au démarrage ou à l'activation, le Service Worker `/firebase-messaging-sw.js` s'enregistre.
   - Le jeton FCM est généré via la clé VAPID (`VITE_FIREBASE_VAPID_KEY`) et stocké dans le document Firestore du chauffeur (`users/{uid}.fcmTokens` et `fcmToken`).

2. **Réception en arrière-plan (PWA & Mobile)** :
   - `/firebase-messaging-sw.js` écoute les messages push `onBackgroundMessage`.
   - Affiche une notification avec vibration intense `[350, 150, 350, 150, 600]`, le prix en FCFA, les adresses de prise en charge et de destination, et un bouton d'action pour ouvrir l'application.

3. **Réception au premier plan** :
   - L'alerte sonore haute puissance (Web Audio API à trois tonalités harmoniques) et la vibration se déclenchent immédiatement.
   - Un toast d'alerte apparaît en haut de l'écran.

4. **Déclencheur automatique Backend (Firebase Cloud Functions)** :
   - Fichier modèle prêt à déployer dans `src/services/fcmBackendGuide.ts` ou via l'onglet dédié dans l'application.
   - Dès qu'un document est créé dans `rides` avec `status: 'pending'`, la fonction sélectionne les chauffeurs en ligne (`isOnline: true`, `role: 'driver'`, `isApprovedDriver: true`) avec un véhicule compatible et envoie un push multicast instantané.

