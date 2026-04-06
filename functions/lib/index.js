"use strict";
/**
 * Firebase Cloud Functions for TASKIFY
 * Auto-creates Firestore user profile when a new user is created in Firebase Auth
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserProfile = void 0;
const v1_1 = require("firebase-functions/v1");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
/**
 * Triggered when a new user is created in Firebase Authentication.
 * Creates a corresponding user profile document in Firestore.
 */
exports.createUserProfile = v1_1.auth.user().onCreate(async (user) => {
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
    }
    catch (error) {
        logger.error(`Failed to create user profile for ${uid}:`, error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map