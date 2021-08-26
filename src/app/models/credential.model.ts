export interface Credential {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  extension?: {
    isInstalled?: boolean;
    reminders?: {
      count: number;
      lastSent: Date;
    };
  };
  isAnonymous: boolean;
  isAdmin?: boolean;
  emailAlerts?: any;
}
