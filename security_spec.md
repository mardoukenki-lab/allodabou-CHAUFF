# Security Specification: Allô Dabou Chauffeur

## 1. Data Invariants
- Users can read their own profile. Authenticated users can read approved driver profiles (for public driver info during a ride).
- Users can create their own profile with `role: 'driver_pending'`, `isApprovedDriver: false`, `approved: false`. Users CANNOT escalate their own role to 'admin' or self-approve.
- Rides can be created by clients (`userId == request.auth.uid`, `status == 'pending'`).
- Pending rides (`status == 'pending'`) can be read by authenticated approved drivers or by the ride owner (`userId == request.auth.uid`).
- Once a ride is accepted by a driver (`status` updated from `pending` to `confirmed` with `driverId == request.auth.uid`), only the client (`userId`) and the assigned driver (`driverId`) can read and update the ride.
- Drivers can only accept a ride if `existing().status == 'pending'` and `existing().driverId == null`.
- Drivers can update status along the lifecycle: `confirmed` -> `driver_arriving` -> `driver_arrived` -> `in_progress` -> `completed`.
- Cancellation is permitted before `in_progress`.
- No updates allowed after `completed` except rating by the client or `paymentStatus` by the driver.

## 2. Dirty Dozen Test Scenarios
1. Attacker tries to create a user document with `role: 'admin'`. (REJECT)
2. Attacker tries to update their own `isApprovedDriver` to `true`. (REJECT)
3. Attacker tries to overwrite another driver's `driverId` on an already confirmed ride. (REJECT)
4. Non-driver client attempts to read other clients' private rides. (REJECT)
5. Driver attempts to skip ride state from `confirmed` directly to `completed`. (REJECT)
6. Malicious user attempts to inject 5MB payload into `pickupAddress`. (REJECT)
7. Driver tries to modify `priceFcfa` after ride is created. (REJECT)
8. Unauthenticated user attempts to list rides. (REJECT)
9. Driver attempts to cancel a ride that is already in `completed` status. (REJECT)
10. Attacker tries to read full user documents of random people without authorization. (REJECT)
11. Attacker attempts to forge `userId` during ride creation to impersonate another person. (REJECT)
12. Driver attempts to accept a ride while setting `driverId` to someone else's UID. (REJECT)
