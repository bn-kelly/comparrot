export interface Credential {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  extension?: {
    show: boolean;
    lastShown: number;
  };
  isAnonymous: boolean;
  isAdmin?: boolean;
  emailAlerts?: any;
}
