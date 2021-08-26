export interface User {
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  extension?: {
    isInstalled?: boolean;
    reminders?: {
      count: number;
      lastSent: Date;
    };
  };
  uid: string;
  isAnonymous: boolean;
  isFirstSignIn: boolean;
  isAdmin?: boolean;
  emailAlerts?: any;
}
