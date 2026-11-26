// CommonJS module for Firebase Functions v2, Node.js 22.
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {getApps, initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
if (!getApps().length) initializeApp();
const db = getFirestore();
const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validId = id => typeof id === 'string' && id.length > 0 && id.length <= 1500 && !id.includes('/') && id !== '.' && id !== '..';

exports.activateFleetInvitationWeb = onCall({region:'us-central1'}, async request => {
  const auth = request.auth;
  const token = auth?.token;
  if (!auth || token?.email_verified !== true || token?.firebase?.sign_in_provider !== 'google.com') {
    throw new HttpsError('unauthenticated','Sign in with your verified Google account.');
  }
  const email = normalizeEmail(token.email);
  const assignmentId = request.data?.assignmentId;
  if (!email || !validId(assignmentId)) throw new HttpsError('invalid-argument','Invalid invitation.');
  const uid = auth.uid;
  const inviteRef = db.collection('fleetPendingMembers').doc(assignmentId);
  return db.runTransaction(async tx => {
    const invite = await tx.get(inviteRef);
    const data = invite.data();
    if (!invite.exists || data.status !== 'PENDING' || data.role !== 'MEMBER' || data.emailNormalized !== email || !validId(data.fleetId)) {
      throw new HttpsError('permission-denied','Invitation is unavailable for this account.');
    }
    const fleetRef = db.collection('fleets').doc(data.fleetId);
    const memberRef = fleetRef.collection('members').doc(uid);
    const [fleet, member] = await Promise.all([tx.get(fleetRef), tx.get(memberRef)]);
    if (!fleet.exists) throw new HttpsError('not-found','Fleet no longer exists.');
    if (member.exists && (member.data().status !== 'ACTIVE' || (member.data().uid && member.data().uid !== uid))) {
      throw new HttpsError('failed-precondition','An existing membership needs administrator verification.');
    }
    // Android v486 uses assignedToEmailNormalized; include exact email fallback for older web records.
    const orders = fleetRef.collection('workOrders');
    const queries = [orders.where('assignedToEmailNormalized','==',email), orders.where('assignedToEmail','==',email)];
    if (token.email !== email) queries.push(orders.where('assignedToEmail','==',token.email));
    const snapshots = await Promise.all(queries.map(q => tx.get(q.limit(401))));
    if (snapshots.some(s => s.size > 400)) throw new HttpsError('resource-exhausted','Too many matching orders. Contact the administrator.');
    const candidates = new Map();
    for (const snap of snapshots) for (const order of snap.docs) {
      const d = order.data();
      const assigned = d.assignedToUid;
      const normalized = normalizeEmail(d.assignedToEmailNormalized || d.assignedToEmail);
      if ((assigned == null || assigned === '') && normalized === email) candidates.set(order.id, order.ref);
    }
    if (candidates.size > 400) throw new HttpsError('resource-exhausted','Too many pending orders. Contact the administrator.');
    // All reads precede writes. Never overwrite an existing member or another assignee.
    if (!member.exists) tx.create(memberRef, {
      uid, email, displayName:typeof token.name==='string'?token.name:'',
      role:'MEMBER', status:'ACTIVE', joinedAt:FieldValue.serverTimestamp()
    });
    for (const ref of candidates.values()) tx.update(ref,{assignedToUid:uid});
    tx.delete(inviteRef);
    return {active:true,fleetId:fleetRef.id,assignedWorkOrders:candidates.size};
  });
});
