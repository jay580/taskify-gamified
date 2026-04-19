/**
 * Firebase Cloud Functions for TASK BUZZ
 * Auto-creates Firestore user profile when a new user is created in Firebase Auth
 */

import { auth, firestore } from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Triggered when a new user is created in Firebase Authentication.
 * Creates a corresponding user profile document in Firestore.
 */
export const createUserProfile = auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  const userProfile = {
    email: email || "",
    name: displayName || "",
    role: "student",
    room: "",
    totalPoints: 0,
    monthlyPoints: 0,
    totalTasks: 0,
    streak: 0,
    level: 1,
    joinDate: admin.firestore.FieldValue.serverTimestamp(),
    avatarColor: "#4CAF50",
  };

  try {
    await admin.firestore().doc(`users/${uid}`).set(userProfile, { merge: true });
    logger.info(`Created user profile for ${email} (${uid})`);
  } catch (error) {
    logger.error(`Failed to create user profile for ${uid}:`, error);
    throw error;
  }
});

/**
 * Triggered when a user document is deleted from Firestore.
 * Deletes the corresponding user from Firebase Auth.
 */
export const onUserDeleted = firestore.document("users/{uid}").onDelete(async (snap, context) => {
  const uid = context.params.uid;
  try {
    await admin.auth().deleteUser(uid);
    logger.info(`Successfully deleted auth user ${uid}`);
  } catch (error) {
    logger.error(`Failed to delete auth user ${uid}:`, error);
  }
});
