export interface Credential {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  ui?: any;
  extension?: {
    show: boolean;
    lastShown: number;
  };
  projectName?: string;
  isAnonymous: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  emailAlerts?: any;
  categoriesOfInterest?: any;
  wishList?: string[];
  personalizationData?: any;
  categoriesDescriptions?: any;
}