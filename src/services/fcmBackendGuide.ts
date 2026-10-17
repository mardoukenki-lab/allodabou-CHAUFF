/**
 * Firebase Cloud Functions & Cloud Messaging Backend Specification for Allô Dabou
 * 
 * Ce fichier documente et fournit le code de déploiement côté backend / Firebase Cloud Functions
 * pour alerter automatiquement par notification push FCM tous les chauffeurs éligibles et en ligne
 * dès qu'une nouvelle course est soumise par un client dans l'application « Allô Dabou VTC ».
 */

export const CLOUD_FUNCTION_SNIPPET = `/**
 * Cloud Function Firebase pour Allô Dabou
 * Déclenchement automatique dès qu'une nouvelle course est créée dans la collection 'rides'
 *
 * Déploiement : firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onNewRideSubmitted = functions.firestore
  .document('rides/{rideId}')
  .onCreate(async (snap, context) => {
    const rideId = context.params.rideId;
    const ride = snap.data();

    // 1. Ne notifier que les courses en statut 'pending'
    if (ride.status !== 'pending') {
      return null;
    }

    const pickup = ride.pickupAddress || 'Dabou';
    const destination = ride.destinationAddress || 'Dabou';
    const priceFcfa = Number(ride.priceFcfa) || 1000;
    const requestedVehicle = ride.vehicleTypeRequested; // 'moto' | 'voiture' | 'any'

    console.log(\`[FCM] Nouvelle course \${rideId} soumise : \${pickup} -> \${destination} (\${priceFcfa} FCFA)\`);

    // 2. Trouver tous les chauffeurs approuvés et en ligne à Dabou
    const usersRef = admin.firestore().collection('users');
    let driversQuery = usersRef
      .where('role', '==', 'driver')
      .where('isApprovedDriver', '==', true)
      .where('isOnline', '==', true);

    const snapshot = await driversQuery.get();
    if (snapshot.empty) {
      console.log('[FCM] Aucun chauffeur en ligne actuellement à Dabou.');
      return null;
    }

    // 3. Collecter les jetons FCM des chauffeurs compatibles
    const tokens = new Set();

    snapshot.forEach((doc) => {
      const driver = doc.data();

      // Vérifier compatibilité véhicule
      if (requestedVehicle === 'moto' && driver.vehicleType !== 'moto') return;
      if (requestedVehicle === 'voiture' && driver.vehicleType !== 'voiture') return;

      // Récupérer les jetons FCM
      if (driver.fcmToken) {
        tokens.add(driver.fcmToken);
      }
      if (Array.isArray(driver.fcmTokens)) {
        driver.fcmTokens.forEach((t) => t && tokens.add(t));
      }
    });

    const tokenList = Array.from(tokens);
    if (tokenList.length === 0) {
      console.log('[FCM] Chauffeurs en ligne trouvés mais aucun jeton FCM enregistré.');
      return null;
    }

    console.log(\`[FCM] Envoi du push à \${tokenList.length} jeton(s) chauffeur...\`);

    // 4. Construire le message FCM optimisé pour mobile et PWA
    const message = {
      notification: {
        title: \`🚖 Course disponible : \${priceFcfa.toLocaleString('fr-FR')} FCFA\`,
        body: \`Départ : \${pickup} ➔ \${destination}\`,
      },
      data: {
        rideId: rideId,
        pickupAddress: pickup,
        destinationAddress: destination,
        priceFcfa: String(priceFcfa),
        serviceType: ride.serviceType || 'vtc',
        click_action: '/',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'allo_dabou_rides',
          priority: 'max',
          vibrateTimingsMillis: [0, 400, 200, 400, 200, 600],
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: \`🚖 Course disponible : \${priceFcfa.toLocaleString('fr-FR')} FCFA\`,
          body: \`Départ : \${pickup} ➔ \${destination}\`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [350, 150, 350, 150, 600],
          requireInteraction: true,
          tag: \`ride-\${rideId}\`,
          renotify: true,
        },
      },
      tokens: tokenList,
    };

    // 5. Envoi multicast
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(\`[FCM] Push envoyé avec succès : \${response.successCount} réussis, \${response.failureCount} échecs\`);

    // Nettoyage des jetons invalides (optionnel)
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokenList[idx]);
        }
      });
      console.log('[FCM] Jetons expirés à purger :', failedTokens.length);
    }

    return response;
  });
`;

export const TOPIC_MESSAGING_EXPLANATION = `
### Alternative par Thème (FCM Topics) :
Les chauffeurs de Dabou peuvent également souscrire aux thèmes suivants :
- \`/topics/drivers_dabou_all\` : Tous les chauffeurs de Dabou
- \`/topics/drivers_dabou_moto\` : Chauffeurs et livreurs en moto
- \`/topics/drivers_dabou_voiture\` : Chauffeurs en voiture (VTC & Taxi)

Lors de la soumission d'une course, l'envoi peut être ciblé vers le topic en une seule requête sans requêter la liste des jetons.
`;
