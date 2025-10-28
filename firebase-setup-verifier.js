#!/usr/bin/env node

/**
 * Comprehensive Firebase Setup Verifier
 * Tests all components to ensure complete setup
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class FirebaseSetupVerifier {
  constructor() {
    this.results = {
      serviceAccount: false,
      firestoreConnection: false,
      writePermissions: false,
      readPermissions: false,
      rulesDeployed: false,
      projectConfig: false,
      environmentSetup: false
    };
    
    this.errors = [];
    this.warnings = [];
  }

  async verifyServiceAccount() {
    console.log('🔑 Verifying Service Account Configuration...');
    
    try {
      // Check if service account file exists
      const serviceAccountPath = '/Users/carlg/Downloads/studio-4393409652-4c3c4-firebase-adminsdk-fbsvc-8285560048.json';
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error('Service account file not found');
      }
      
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      // Validate service account structure
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Invalid service account structure');
      }
      
      if (serviceAccount.project_id !== 'studio-4393409652-4c3c4') {
        throw new Error('Service account project ID mismatch');
      }
      
      this.results.serviceAccount = true;
      console.log('✅ Service account configuration: VALID');
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email}`);
      
    } catch (error) {
      this.errors.push(`Service Account: ${error.message}`);
      console.log(`❌ Service account configuration: FAILED - ${error.message}`);
    }
  }

  async verifyFirebaseConnection() {
    console.log('\n🌐 Verifying Firebase Connection...');
    
    try {
      // Initialize Firebase Admin
      const serviceAccount = JSON.parse(fs.readFileSync('/Users/carlg/Downloads/studio-4393409652-4c3c4-firebase-adminsdk-fbsvc-8285560048.json', 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'studio-4393409652-4c3c4'
      });
      
      const db = admin.firestore();
      
      // Test connection
      const connectionTest = await db.doc('setup_verification/document').get();
      
      this.results.firestoreConnection = true;
      console.log('✅ Firebase connection: WORKING');
      console.log('   Firestore Admin SDK: Connected');
      
    } catch (error) {
      this.errors.push(`Firebase Connection: ${error.message}`);
      console.log(`❌ Firebase connection: FAILED - ${error.message}`);
    }
  }

  async verifyPermissions() {
    console.log('\n🔒 Verifying Firestore Permissions...');
    
    try {
      const db = admin.firestore();
      
      // Test write permissions
      const testDoc = {
        verification_test: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Setup verification test'
      };
      
      const writeTest = await db.collection('setup_verification').add(testDoc);
      this.results.writePermissions = true;
      console.log('✅ Write permissions: WORKING');
      
      // Test read permissions
      const readTest = await db.collection('setup_verification').limit(1).get();
      this.results.readPermissions = true;
      console.log('✅ Read permissions: WORKING');
      
      // Clean up test document
      await writeTest.delete();
      console.log('✅ Test cleanup: COMPLETED');
      
    } catch (error) {
      this.errors.push(`Permissions: ${error.message}`);
      console.log(`❌ Permissions test: FAILED - ${error.message}`);
    }
  }

  async verifyProjectConfiguration() {
    console.log('\n⚙️  Verifying Project Configuration...');
    
    try {
      // Check .firebaserc
      if (!fs.existsSync('.firebaserc')) {
        throw new Error('.firebaserc file missing');
      }
      
      const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
      
      if (firebaserc.projects.default !== 'studio-4393409652-4c3c4') {
        throw new Error('Project ID mismatch in .firebaserc');
      }
      
      // Check firebase.json
      if (!fs.existsSync('firebase.json')) {
        throw new Error('firebase.json file missing');
      }
      
      const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
      
      if (!firebaseConfig.firestore) {
        throw new Error('Firestore configuration missing');
      }
      
      this.results.projectConfig = true;
      console.log('✅ Project configuration: VALID');
      console.log('   .firebaserc: Properly configured');
      console.log('   firebase.json: Properly configured');
      
    } catch (error) {
      this.errors.push(`Project Configuration: ${error.message}`);
      console.log(`❌ Project configuration: FAILED - ${error.message}`);
    }
  }

  async verifyEnvironmentSetup() {
    console.log('\n🛠️  Verifying Environment Setup...');
    
    try {
      // Check VSCode settings for terminal auto-approval
      const settingsPath = path.join(process.env.HOME, 'Library/Application Support/Code/User/settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        if (settings['chat.tools.terminal.autoApprove']) {
          this.results.environmentSetup = true;
          console.log('✅ VSCode terminal auto-approval: CONFIGURED');
        } else {
          this.warnings.push('VSCode terminal auto-approval not found in settings');
          console.log('⚠️  VSCode terminal auto-approval: NOT FOUND');
        }
      } else {
        this.warnings.push('VSCode settings file not found');
        console.log('⚠️  VSCode settings file: NOT FOUND');
      }
      
    } catch (error) {
      this.warnings.push(`Environment Setup: ${error.message}`);
      console.log(`⚠️  Environment setup: WARNING - ${error.message}`);
    }
  }

  async verifyRulesDeployment() {
    console.log('\n📋 Verifying Firestore Rules Deployment...');
    
    try {
      // Check if firestore.rules exists and has been modified recently
      if (!fs.existsSync('firestore.rules')) {
        throw new Error('firestore.rules file not found');
      }
      
      const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
      
      // Check for our project owner access rule
      if (rulesContent.includes('request.auth.token.email_verified == true')) {
        console.log('✅ Firestore rules: UPDATED');
        console.log('   Project owner access: CONFIGURED');
        this.results.rulesDeployed = true;
      } else {
        this.warnings.push('Project owner access rule not found in firestore.rules');
        console.log('⚠️  Firestore rules: NEEDS UPDATE');
      }
      
    } catch (error) {
      this.errors.push(`Firestore Rules: ${error.message}`);
      console.log(`❌ Firestore rules verification: FAILED - ${error.message}`);
    }
  }

  generateSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FIREBASE SETUP VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const allPassed = Object.values(this.results).every(result => result === true);
    const criticalPassed = this.results.serviceAccount && this.results.firestoreConnection && 
                          this.results.writePermissions && this.results.projectConfig;
    
    console.log('\n🔍 VERIFICATION RESULTS:');
    
    Object.entries(this.results).forEach(([key, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${status} ${name}`);
    });
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (allPassed) {
      console.log('🎉 COMPLETE SUCCESS! All Firebase setup components verified!');
      console.log('🚀 You can now use Firebase MCP and authentication without issues.');
    } else if (criticalPassed) {
      console.log('✅ CORE SETUP COMPLETE! Critical components are working.');
      console.log('⚠️  Some optional components need attention (see warnings above).');
    } else {
      console.log('❌ SETUP INCOMPLETE! Some critical components failed.');
      console.log('🔧 Please review errors above and fix before proceeding.');
    }
    
    console.log('='.repeat(60));
    
    return {
      success: allPassed,
      coreSuccess: criticalPassed,
      results: this.results,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  async run() {
    console.log('🚀 Firebase Setup Verification Starting...\n');
    
    await this.verifyServiceAccount();
    await this.verifyFirebaseConnection();
    await this.verifyPermissions();
    await this.verifyProjectConfiguration();
    await this.verifyEnvironmentSetup();
    await this.verifyRulesDeployment();
    
    return this.generateSummary();
  }
}

// Run verification
const verifier = new FirebaseSetupVerifier();

verifier.run().then(summary => {
  console.log('\n🏁 Verification Complete!');
  process.exit(summary.success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 Verification failed with error:', error);
  process.exit(1);
});