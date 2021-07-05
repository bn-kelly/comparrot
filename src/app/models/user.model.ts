export interface User {
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  photoURL?: string;
  extension?: {
    show: boolean;
    lastShown: number;
  };
  uid: string;
  isAnonymous: boolean;
  isAdmin?: boolean;
  emailAlerts?: any;
}
